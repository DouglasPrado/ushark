"use strict";

const MAX_CANDIDATES = 64;
const MAX_SAMPLES_PER_SOURCE = 120;
const MAX_CONCURRENT_PROBES = 3;
const PROBE_BYTES_MAXIMUM = 8 * 1024 * 1024;
const DETAILS_TTL_MS = 15_000;
const CARD_TTL_MS = 90_000;

class HealthSamplerError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "HealthSamplerError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validId(value, name) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new HealthSamplerError(
      "SELECTION_INVALID",
      `A identidade de ${name} não é válida.`,
    );
  return value;
}

function cancelled() {
  return new HealthSamplerError(
    "SELECTION_CANCELLED",
    "A medição foi cancelada.",
  );
}

class TorrentHealthMetricsAdapter {
  constructor({ daemon, sourceResolver }) {
    if (!daemon || !sourceResolver)
      throw new HealthSamplerError(
        "SELECTION_INVALID",
        "O adapter de métricas não é válido.",
      );
    this.daemon = daemon;
    this.sourceResolver = sourceResolver;
  }

  async sample({ contentId, candidate, signal }) {
    if (signal?.aborted) throw cancelled();
    if (candidate.completedLocal === true)
      return {
        sourceId: candidate.sourceId,
        observedAt: new Date().toISOString(),
        completedLocal: true,
        downloadThroughputBitsPerSecond: 0,
        connectedPeers: 0,
        usefulPeers: 0,
        probeBytes: 0,
      };
    const resolved = await this.sourceResolver.resolve({
      contentId,
      sourceId: candidate.sourceId,
      fileId: candidate.fileId,
    });
    if (signal?.aborted) throw cancelled();
    const geometry = await this.daemon.describeStream(
      resolved.torrentId,
      resolved.fileId,
    );
    const probePieces = Math.max(
      1,
      Math.floor(PROBE_BYTES_MAXIMUM / geometry.pieceLengthBytes),
    );
    const raw = await this.daemon.healthSample(
      resolved.torrentId,
      resolved.fileId,
      {
        wantedFirstPiece: geometry.firstPiece,
        wantedLastPiece: Math.min(
          geometry.lastPiece,
          geometry.firstPiece + probePieces - 1,
        ),
      },
    );
    if (signal?.aborted) throw cancelled();
    return {
      sourceId: candidate.sourceId,
      observedAt: raw.observedAt,
      completedLocal: raw.completedLocal === true,
      downloadThroughputBitsPerSecond:
        Number(raw.downloadThroughputBytesPerSecond ?? 0) * 8,
      connectedPeers: Number(raw.connectedPeers ?? 0),
      usefulPeers: Number(raw.usefulPeers ?? 0),
      wantedPieceAvailabilityMinimum: raw.wantedPieceAvailabilityMinimum,
      wantedPieceAvailabilityMedian: raw.wantedPieceAvailabilityMedian,
      wantedPiecesAvailableRatio: raw.wantedPiecesAvailableRatio,
      probeBytes: 0,
    };
  }
}

class ProgressiveHealthSampler {
  constructor(adapter, options = {}) {
    if (!adapter || typeof adapter.sample !== "function")
      throw new HealthSamplerError(
        "SELECTION_INVALID",
        "O sampler de Health não é válido.",
      );
    this.adapter = adapter;
    this.clock = options.clock ?? (() => Date.now());
    this.concurrentMaximum = Math.min(
      MAX_CONCURRENT_PROBES,
      Math.max(1, options.concurrentMaximum ?? MAX_CONCURRENT_PROBES),
    );
    this.cache = new Map();
    this.history = new Map();
  }

  ttl(context) {
    return context === "details" ? DETAILS_TTL_MS : CARD_TTL_MS;
  }

  append(sample) {
    const values = this.history.get(sample.sourceId) ?? [];
    values.push(structuredClone(sample));
    if (values.length > MAX_SAMPLES_PER_SOURCE)
      values.splice(0, values.length - MAX_SAMPLES_PER_SOURCE);
    this.history.set(sample.sourceId, values);
  }

  samples(sourceId) {
    return structuredClone(this.history.get(sourceId) ?? []);
  }

  async measure(input, signal, onUpdate = () => {}) {
    const contentId = validId(input?.contentId, "conteúdo");
    const candidates = input?.candidates;
    if (
      !Array.isArray(candidates) ||
      candidates.length > MAX_CANDIDATES ||
      candidates.some(
        (candidate) => !candidate || typeof candidate !== "object",
      )
    )
      throw new HealthSamplerError(
        "SELECTION_INVALID",
        "As sources para medição não são válidas.",
      );
    if (signal?.aborted) throw cancelled();
    const results = new Array(candidates.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < candidates.length) {
        if (signal?.aborted) throw cancelled();
        const index = cursor++;
        const candidate = {
          ...candidates[index],
          sourceId: validId(candidates[index].sourceId, "source"),
        };
        const cacheKey = `${input.context}:${candidate.sourceId}`;
        const cached = this.cache.get(cacheKey);
        let sample;
        if (cached && cached.expiresAt > this.clock()) {
          sample = structuredClone(cached.sample);
        } else {
          try {
            sample = await this.adapter.sample({
              contentId,
              candidate,
              signal,
            });
          } catch (error) {
            if (signal?.aborted || error?.code === "SELECTION_CANCELLED")
              throw cancelled();
            sample = {
              sourceId: candidate.sourceId,
              observedAt: new Date(this.clock()).toISOString(),
              completedLocal: false,
              downloadThroughputBitsPerSecond: 0,
              connectedPeers: 0,
              usefulPeers: 0,
              probeBytes: 0,
              error: {
                code: error?.code ?? "SELECTION_SOURCE_UNAVAILABLE",
                message:
                  error?.publicMessage ??
                  error?.message ??
                  "A source não pôde ser medida.",
              },
            };
          }
          if (signal?.aborted) throw cancelled();
          this.cache.set(cacheKey, {
            sample: structuredClone(sample),
            expiresAt: this.clock() + this.ttl(input.context),
          });
          this.append(sample);
        }
        if (signal?.aborted) throw cancelled();
        results[index] = sample;
        onUpdate(structuredClone(sample), index);
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(this.concurrentMaximum, candidates.length) },
        worker,
      ),
    );
    return results;
  }
}

module.exports = {
  CARD_TTL_MS,
  DETAILS_TTL_MS,
  HealthSamplerError,
  MAX_CANDIDATES,
  MAX_CONCURRENT_PROBES,
  MAX_SAMPLES_PER_SOURCE,
  PROBE_BYTES_MAXIMUM,
  ProgressiveHealthSampler,
  TorrentHealthMetricsAdapter,
};
