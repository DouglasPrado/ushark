"use strict";

const { Buffer } = require("node:buffer");
const { createHash, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const LIMITS = Object.freeze({
  magnetUtf8Bytes: 4_096,
  torrentFileBytes: 10 * 1_024 * 1_024,
  bencodeDepth: 64,
  bencodeNodes: 200_000,
  files: 10_000,
  pathComponents: 64,
  pathComponentUtf8Bytes: 255,
  normalizedPathUtf8Bytes: 4_096,
  totalDeclaredBytes: 16 * 1_024 * 1_024 * 1_024 * 1_024,
  pieces: 4_000_000,
  displayNameUtf8Bytes: 512,
});

const VIDEO_EXTENSIONS = new Set([
  ".avi",
  ".m2ts",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ts",
  ".webm",
  ".wmv",
]);
const EXTRA_PATTERN =
  /(^|[ ._\-/])(bonus|extra|featurette|making[ ._-]?of|trailer)([ ._\-/]|$)/i;
const SAMPLE_PATTERN = /(^|[ ._\-/])sample([ ._\-/]|$)/i;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const utf8 = new TextDecoder("utf-8", { fatal: true });

class TorrentInputError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "TorrentInputError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function fail(code, message, cause) {
  throw new TorrentInputError(code, message, false, cause);
}

function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}

function decodeUtf8(value, field) {
  try {
    return utf8.decode(value);
  } catch (error) {
    fail("TORRENT_INPUT_INVALID", `${field} não usa UTF-8 válido.`, error);
  }
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let accumulator = 0;
  let bits = 0;
  const output = [];
  for (const character of value.toUpperCase()) {
    const index = alphabet.indexOf(character);
    if (index < 0)
      fail("TORRENT_INPUT_INVALID", "O infoHash BTIH não é válido.");
    accumulator = (accumulator << 5) | index;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      output.push((accumulator >>> bits) & 0xff);
      accumulator &= (1 << bits) - 1;
    }
  }
  if (bits !== 0 || output.length !== 20)
    fail("TORRENT_INPUT_INVALID", "O infoHash BTIH não é válido.");
  return Buffer.from(output).toString("hex");
}

function parseMagnet(value) {
  if (typeof value !== "string" || byteLength(value) > LIMITS.magnetUtf8Bytes)
    fail("TORRENT_INPUT_TOO_LARGE", "O magnet excede o limite de 4.096 bytes.");
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    fail("TORRENT_INPUT_INVALID", "O magnet não é válido.", error);
  }
  if (url.protocol !== "magnet:")
    fail("TORRENT_INPUT_INVALID", "A entrada precisa usar o scheme magnet:.");
  const supported = new Set(["xt", "dn", "tr", "xl", "xs"]);
  for (const [key] of url.searchParams)
    if (!supported.has(key))
      fail(
        "TORRENT_INPUT_INVALID",
        `O parâmetro de magnet ${key} não é suportado.`,
      );
  const exactTopics = url.searchParams.getAll("xt");
  if (exactTopics.length !== 1)
    fail("TORRENT_INPUT_INVALID", "Informe exatamente um infoHash BTIH.");
  const match = /^urn:btih:([a-f0-9]{40}|[a-z2-7]{32})$/i.exec(exactTopics[0]);
  if (!match) fail("TORRENT_INPUT_INVALID", "O infoHash BTIH não é válido.");
  const infoHash =
    match[1].length === 40 ? match[1].toLowerCase() : decodeBase32(match[1]);
  const displayName = url.searchParams.get("dn")?.trim() || "Magnet sem nome";
  if (byteLength(displayName) > LIMITS.displayNameUtf8Bytes)
    fail("TORRENT_INPUT_TOO_LARGE", "O nome do magnet excede o limite.");
  for (const tracker of url.searchParams.getAll("tr")) {
    let trackerUrl;
    try {
      trackerUrl = new URL(tracker);
    } catch (error) {
      fail("TORRENT_INPUT_INVALID", "O tracker do magnet não é válido.", error);
    }
    if (!new Set(["http:", "https:", "udp:"]).has(trackerUrl.protocol))
      fail("TORRENT_INPUT_INVALID", "O protocolo do tracker não é suportado.");
  }
  const exactLength = url.searchParams.get("xl");
  if (exactLength !== null && !/^(0|[1-9][0-9]*)$/.test(exactLength))
    fail(
      "TORRENT_INPUT_INVALID",
      "O tamanho declarado no magnet não é válido.",
    );
  if (
    exactLength !== null &&
    BigInt(exactLength) > BigInt(LIMITS.totalDeclaredBytes)
  )
    fail("TORRENT_INPUT_TOO_LARGE", "O tamanho declarado excede o limite.");
  return {
    type: "magnet",
    infoHash,
    displayName,
    trackerCount: url.searchParams.getAll("tr").length,
    exactLengthBytes: exactLength === null ? undefined : Number(exactLength),
    inputLabel: `${displayName} · ${infoHash.slice(0, 8)}`,
  };
}

function parseBencode(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (!bytes.length || bytes.length > LIMITS.torrentFileBytes)
    fail(
      "TORRENT_INPUT_TOO_LARGE",
      "O arquivo .torrent excede o limite de 10 MiB.",
    );
  let offset = 0;
  let nodes = 0;
  const parseNode = (depth) => {
    nodes += 1;
    if (nodes > LIMITS.bencodeNodes || depth > LIMITS.bencodeDepth)
      fail(
        "TORRENT_INPUT_TOO_LARGE",
        "O bencode excede os limites estruturais.",
      );
    const start = offset;
    const marker = bytes[offset];
    if (marker === 0x69) {
      const end = bytes.indexOf(0x65, offset + 1);
      if (end < 0) fail("TORRENT_INPUT_INVALID", "Inteiro bencode incompleto.");
      const raw = bytes.subarray(offset + 1, end).toString("ascii");
      if (!/^(0|-?[1-9][0-9]*)$/.test(raw) || raw === "-0")
        fail("TORRENT_INPUT_INVALID", "Inteiro bencode não canônico.");
      const big = BigInt(raw);
      if (
        big > BigInt(Number.MAX_SAFE_INTEGER) ||
        big < BigInt(Number.MIN_SAFE_INTEGER)
      )
        fail(
          "TORRENT_INPUT_TOO_LARGE",
          "Inteiro bencode excede o limite seguro.",
        );
      offset = end + 1;
      return { type: "integer", value: Number(big), start, end: offset };
    }
    if (marker === 0x6c) {
      offset += 1;
      const value = [];
      while (offset < bytes.length && bytes[offset] !== 0x65)
        value.push(parseNode(depth + 1));
      if (offset >= bytes.length)
        fail("TORRENT_INPUT_INVALID", "Lista bencode incompleta.");
      offset += 1;
      return { type: "list", value, start, end: offset };
    }
    if (marker === 0x64) {
      offset += 1;
      const value = [];
      let previous;
      while (offset < bytes.length && bytes[offset] !== 0x65) {
        const key = parseNode(depth + 1);
        if (key.type !== "bytes")
          fail(
            "TORRENT_INPUT_INVALID",
            "Chave de dicionário bencode inválida.",
          );
        if (previous && Buffer.compare(previous, key.value) >= 0)
          fail(
            "TORRENT_INPUT_INVALID",
            "Dicionário bencode fora de ordem ou duplicado.",
          );
        previous = key.value;
        value.push([key, parseNode(depth + 1)]);
      }
      if (offset >= bytes.length)
        fail("TORRENT_INPUT_INVALID", "Dicionário bencode incompleto.");
      offset += 1;
      return { type: "dictionary", value, start, end: offset };
    }
    if (marker >= 0x30 && marker <= 0x39) {
      const colon = bytes.indexOf(0x3a, offset);
      if (colon < 0)
        fail("TORRENT_INPUT_INVALID", "String bencode incompleta.");
      const rawLength = bytes.subarray(offset, colon).toString("ascii");
      if (!/^(0|[1-9][0-9]*)$/.test(rawLength))
        fail("TORRENT_INPUT_INVALID", "String bencode não canônica.");
      const length = Number(rawLength);
      if (!Number.isSafeInteger(length) || length > LIMITS.torrentFileBytes)
        fail("TORRENT_INPUT_TOO_LARGE", "String bencode excede o limite.");
      const contentStart = colon + 1;
      const contentEnd = contentStart + length;
      if (contentEnd > bytes.length)
        fail("TORRENT_INPUT_INVALID", "String bencode truncada.");
      offset = contentEnd;
      return {
        type: "bytes",
        value: bytes.subarray(contentStart, contentEnd),
        start,
        end: offset,
      };
    }
    fail("TORRENT_INPUT_INVALID", "Token bencode inválido.");
  };
  const root = parseNode(0);
  if (offset !== bytes.length)
    fail("TORRENT_INPUT_INVALID", "Há dados após o fim do bencode.");
  return root;
}

function dictionaryGet(node, name) {
  if (node?.type !== "dictionary") return undefined;
  const found = node.value.find(([key]) => key.value.equals(Buffer.from(name)));
  return found?.[1];
}

function requireInteger(node, field) {
  if (node?.type !== "integer" || node.value < 0)
    fail("TORRENT_INPUT_INVALID", `${field} não é válido.`);
  return node.value;
}

function requireBytes(node, field) {
  if (node?.type !== "bytes")
    fail("TORRENT_INPUT_INVALID", `${field} não é válido.`);
  return node.value;
}

function validateTorrentPathComponents(components) {
  if (
    !Array.isArray(components) ||
    !components.length ||
    components.length > LIMITS.pathComponents
  )
    fail("TORRENT_PATH_REJECTED", "O path interno do torrent não é permitido.");
  const normalized = components.map((component) => {
    if (
      typeof component !== "string" ||
      !component ||
      component === "." ||
      component === ".." ||
      component.includes("\0") ||
      component.includes("/") ||
      component.includes("\\") ||
      component.includes(":") ||
      component.endsWith(".") ||
      component.endsWith(" ") ||
      WINDOWS_RESERVED.test(component) ||
      byteLength(component) > LIMITS.pathComponentUtf8Bytes
    )
      fail(
        "TORRENT_PATH_REJECTED",
        "O path interno do torrent não é permitido.",
      );
    return component.normalize("NFC");
  });
  const joined = normalized.join("/");
  if (byteLength(joined) > LIMITS.normalizedPathUtf8Bytes)
    fail("TORRENT_PATH_REJECTED", "O path interno do torrent excede o limite.");
  return joined;
}

function classifyFile(name, sizeBytes) {
  const extension = path.posix.extname(name).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(extension)) return "other";
  if (SAMPLE_PATTERN.test(name) || sizeBytes < 50 * 1_024 * 1_024)
    return "sample";
  if (EXTRA_PATTERN.test(name)) return "extra";
  return "video";
}

function parseTorrentFile(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  const root = parseBencode(bytes);
  if (root.type !== "dictionary")
    fail("TORRENT_INPUT_INVALID", "O .torrent precisa ter um dicionário raiz.");
  const info = dictionaryGet(root, "info");
  if (info?.type !== "dictionary")
    fail("TORRENT_INPUT_INVALID", "O dicionário info está ausente.");
  const infoHash = createHash("sha1")
    .update(bytes.subarray(info.start, info.end))
    .digest("hex");
  const nameNode =
    dictionaryGet(info, "name.utf-8") ?? dictionaryGet(info, "name");
  const name = decodeUtf8(requireBytes(nameNode, "O nome"), "O nome").normalize(
    "NFC",
  );
  if (!name || byteLength(name) > LIMITS.displayNameUtf8Bytes)
    fail("TORRENT_INPUT_TOO_LARGE", "O nome do torrent excede o limite.");
  validateTorrentPathComponents([name]);
  const pieceLength = requireInteger(
    dictionaryGet(info, "piece length"),
    "piece length",
  );
  if (pieceLength < 16 * 1_024 || pieceLength > 32 * 1_024 * 1_024)
    fail("TORRENT_INPUT_INVALID", "O tamanho de piece não é válido.");
  const pieces = requireBytes(dictionaryGet(info, "pieces"), "pieces");
  if (pieces.length % 20 !== 0 || pieces.length / 20 > LIMITS.pieces)
    fail("TORRENT_INPUT_TOO_LARGE", "A lista de pieces não é válida.");
  const filesNode = dictionaryGet(info, "files");
  const lengthNode = dictionaryGet(info, "length");
  if (!!filesNode === !!lengthNode)
    fail(
      "TORRENT_INPUT_INVALID",
      "O torrent deve declarar exatamente um formato de arquivos.",
    );
  const rawFiles = [];
  if (lengthNode) {
    rawFiles.push({
      components: [name],
      sizeBytes: requireInteger(lengthNode, "length"),
    });
  } else {
    if (
      filesNode.type !== "list" ||
      !filesNode.value.length ||
      filesNode.value.length > LIMITS.files
    )
      fail("TORRENT_INPUT_TOO_LARGE", "A lista de arquivos excede o limite.");
    for (const file of filesNode.value) {
      if (file.type !== "dictionary")
        fail("TORRENT_INPUT_INVALID", "Uma entrada de arquivo não é válida.");
      const pathNode =
        dictionaryGet(file, "path.utf-8") ?? dictionaryGet(file, "path");
      if (pathNode?.type !== "list")
        fail("TORRENT_PATH_REJECTED", "O path de um arquivo não é válido.");
      const components = pathNode.value.map((component) =>
        decodeUtf8(
          requireBytes(component, "Componente de path"),
          "Componente de path",
        ),
      );
      rawFiles.push({
        components: [name, ...components],
        sizeBytes: requireInteger(dictionaryGet(file, "length"), "length"),
      });
    }
  }
  let totalSizeBytes = 0;
  let offsetBytes = 0;
  const files = rawFiles.map((file, index) => {
    totalSizeBytes += file.sizeBytes;
    if (
      !Number.isSafeInteger(totalSizeBytes) ||
      totalSizeBytes > LIMITS.totalDeclaredBytes
    )
      fail(
        "TORRENT_INPUT_TOO_LARGE",
        "O tamanho total declarado excede 16 TiB.",
      );
    const torrentPath = validateTorrentPathComponents(file.components);
    const fileName = file.components.at(-1);
    const firstPiece =
      file.sizeBytes === 0 ? undefined : Math.floor(offsetBytes / pieceLength);
    const lastPiece =
      file.sizeBytes === 0
        ? undefined
        : Math.floor((offsetBytes + file.sizeBytes - 1) / pieceLength);
    const kind = classifyFile(torrentPath, file.sizeBytes);
    const result = {
      id: `file:${index}`,
      index,
      path: torrentPath,
      name: fileName,
      extension: path.posix.extname(fileName).toLowerCase(),
      sizeBytes: file.sizeBytes,
      offsetBytes,
      firstPiece,
      lastPiece,
      kind,
      selectable: kind === "video",
    };
    offsetBytes += file.sizeBytes;
    return result;
  });
  const expectedPieceCount =
    totalSizeBytes === 0 ? 0 : Math.ceil(totalSizeBytes / pieceLength);
  if (pieces.length / 20 !== expectedPieceCount)
    fail(
      "TORRENT_INPUT_INVALID",
      "A contagem de pieces não corresponde ao tamanho declarado.",
    );
  return {
    infoHash,
    name,
    files,
    pieceLengthBytes: pieceLength,
    pieceCount: expectedPieceCount,
    totalSizeBytes,
  };
}

function relativeContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    !!relative &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}

function assertExistingPathContained(root, candidate) {
  const absoluteRoot = path.resolve(root);
  const realRoot = fs.realpathSync(absoluteRoot);
  const absoluteCandidate = path.resolve(candidate);
  const lexicalRoot = relativeContained(absoluteRoot, absoluteCandidate)
    ? absoluteRoot
    : relativeContained(realRoot, absoluteCandidate)
      ? realRoot
      : undefined;
  if (!lexicalRoot)
    fail(
      "TORRENT_PATH_REJECTED",
      "O arquivo está fora do diretório gerenciado.",
    );
  let current = lexicalRoot;
  for (const component of path
    .relative(lexicalRoot, absoluteCandidate)
    .split(path.sep)) {
    current = path.join(current, component);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink())
      fail(
        "TORRENT_PATH_REJECTED",
        "Symlink não é permitido no diretório gerenciado.",
      );
  }
  const realCandidate = fs.realpathSync(absoluteCandidate);
  if (!relativeContained(realRoot, realCandidate))
    fail(
      "TORRENT_PATH_REJECTED",
      "O arquivo está fora do diretório gerenciado.",
    );
  return realCandidate;
}

class TorrentInputStore {
  constructor(root, options = {}) {
    if (typeof root !== "string" || !path.isAbsolute(root))
      fail("TORRENT_PATH_REJECTED", "O diretório gerenciado não é válido.");
    this.root = path.resolve(root);
    this.selectionTtlMs = options.selectionTtlMs ?? 10 * 60 * 1000;
    this.now = options.now ?? (() => Date.now());
    this.selections = new Map();
    fs.mkdirSync(this.root, { recursive: true, mode: 0o700 });
    this.root = fs.realpathSync(this.root);
  }

  select(sourcePath, signal) {
    if (signal?.aborted)
      throw new TorrentInputError(
        "TORRENT_CANCELLED",
        "A importação foi cancelada.",
      );
    const sourceStat = fs.lstatSync(sourcePath);
    if (!sourceStat.isFile() || sourceStat.isSymbolicLink())
      fail("TORRENT_PATH_REJECTED", "Selecione um arquivo .torrent regular.");
    if (sourceStat.size > LIMITS.torrentFileBytes)
      fail("TORRENT_INPUT_TOO_LARGE", "O arquivo .torrent excede 10 MiB.");
    const extension = path.extname(sourcePath).toLowerCase();
    if (extension !== ".torrent")
      fail(
        "TORRENT_INPUT_INVALID",
        "Selecione um arquivo com extensão .torrent.",
      );
    const selectionId = randomUUID();
    const temporary = path.join(this.root, `.partial-${selectionId}`);
    const target = path.join(this.root, `${selectionId}.torrent`);
    const noFollow = fs.constants.O_NOFOLLOW ?? 0;
    let source;
    let destination;
    try {
      source = fs.openSync(sourcePath, fs.constants.O_RDONLY | noFollow);
      const opened = fs.fstatSync(source);
      if (!opened.isFile() || opened.size !== sourceStat.size)
        fail("TORRENT_INPUT_INVALID", "O arquivo mudou durante a seleção.");
      destination = fs.openSync(
        temporary,
        fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL,
        0o600,
      );
      const chunk = Buffer.allocUnsafe(64 * 1024);
      let copied = 0;
      while (true) {
        if (signal?.aborted)
          throw new TorrentInputError(
            "TORRENT_CANCELLED",
            "A importação foi cancelada.",
          );
        const read = fs.readSync(source, chunk, 0, chunk.length, null);
        if (!read) break;
        copied += read;
        if (copied > LIMITS.torrentFileBytes)
          fail("TORRENT_INPUT_TOO_LARGE", "O arquivo .torrent excede 10 MiB.");
        fs.writeSync(destination, chunk, 0, read);
      }
      fs.fsyncSync(destination);
      fs.closeSync(destination);
      destination = undefined;
      fs.closeSync(source);
      source = undefined;
      fs.renameSync(temporary, target);
      const managedPath = assertExistingPathContained(this.root, target);
      const bytes = fs.readFileSync(managedPath);
      const metadata = parseTorrentFile(bytes);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const value = {
        selectionId,
        fileName: path.basename(sourcePath),
        sizeBytes: bytes.length,
        managedPath,
        sha256,
        metadata,
        expiresAt: this.now() + this.selectionTtlMs,
      };
      this.selections.set(selectionId, value);
      return {
        selectionId,
        fileName: value.fileName,
        sizeBytes: value.sizeBytes,
      };
    } catch (error) {
      if (source !== undefined) fs.closeSync(source);
      if (destination !== undefined) fs.closeSync(destination);
      for (const candidate of [temporary, target])
        if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
      if (error instanceof TorrentInputError) throw error;
      throw new TorrentInputError(
        "TORRENT_INPUT_INVALID",
        "Não foi possível preparar o arquivo .torrent.",
        false,
        error,
      );
    }
  }

  resolve(selectionId) {
    const value = this.selections.get(selectionId);
    if (!value)
      fail("TORRENT_NOT_FOUND", "A seleção de torrent não foi encontrada.");
    if (value.expiresAt <= this.now()) {
      this.release(selectionId);
      fail(
        "TORRENT_INPUT_EXPIRED",
        "A seleção expirou. Escolha o arquivo novamente.",
      );
    }
    return {
      ...value,
      metadata: structuredClone(value.metadata),
    };
  }

  release(selectionId) {
    const value = this.selections.get(selectionId);
    if (!value) return false;
    this.selections.delete(selectionId);
    const managedPath = assertExistingPathContained(
      this.root,
      value.managedPath,
    );
    fs.unlinkSync(managedPath);
    return true;
  }
}

module.exports = {
  LIMITS,
  TorrentInputError,
  TorrentInputStore,
  assertExistingPathContained,
  classifyFile,
  parseBencode,
  parseMagnet,
  parseTorrentFile,
  validateTorrentPathComponents,
};
