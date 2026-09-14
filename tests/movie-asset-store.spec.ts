import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { ConfigurationStore } = require("@ushark/core/configuration") as {
  ConfigurationStore: new (
    databasePath: string,
    dataRoot: string,
  ) => {
    close(): void;
  };
};

interface AssetDescriptor {
  assetId: string;
  uri: string;
  mediaType: string;
  byteLength: number;
}

const {
  MAX_IMAGE_BYTES,
  MovieAssetStore,
}: {
  MAX_IMAGE_BYTES: number;
  MovieAssetStore: new (
    databasePath: string,
    cacheRoot: string,
    options?: { fetchImpl?: typeof fetch; timeoutMs?: number },
  ) => {
    cacheRemoteImage(
      url: string,
      signal?: AbortSignal,
    ): Promise<AssetDescriptor>;
    cacheUploadedImage(
      value: string,
      fileName: string,
      mediaType: string,
    ): AssetDescriptor & { fileName: string };
    resolveUri(uri: string): (AssetDescriptor & { path: string }) | undefined;
    close(): void;
  };
} = require("@ushark/core/movie-assets");

function fixture(fetchImpl: typeof fetch) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-assets-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  configuration.close();
  return {
    root,
    store: new MovieAssetStore(databasePath, path.join(root, "cache"), {
      fetchImpl,
      timeoutMs: 100,
    }),
  };
}

const tinyPng = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test("M02 cache grava imagem validada por hash e reabre offline", async () => {
  let calls = 0;
  const { root, store } = fixture((async () => {
    calls += 1;
    return new Response(tinyPng, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  }) as typeof fetch);
  try {
    const url = "https://image.tmdb.org/t/p/w500/poster.png";
    const first = await store.cacheRemoteImage(url);
    const second = await store.cacheRemoteImage(url);
    expect(second).toEqual(first);
    expect(calls).toBe(1);
    expect(first).toMatchObject({
      uri: `ushark-asset://${first.assetId}`,
      mediaType: "image/png",
      byteLength: tinyPng.length,
    });
    const resolved = store.resolveUri(first.uri);
    expect(resolved?.path.startsWith(path.join(root, "cache"))).toBe(true);
    expect(fs.readFileSync(resolved!.path)).toEqual(Buffer.from(tinyPng));
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 cache bloqueia SSRF, redirects, formato e tamanho hostis", async () => {
  const { root, store } = fixture(
    (async () => new Response("not-an-image", { status: 200 })) as typeof fetch,
  );
  try {
    await expect(
      store.cacheRemoteImage("http://image.tmdb.org/t/p/w500/a.jpg"),
    ).rejects.toMatchObject({ code: "CATALOG_UNAUTHORIZED" });
    await expect(
      store.cacheRemoteImage("https://127.0.0.1/t/p/w500/a.jpg"),
    ).rejects.toMatchObject({ code: "CATALOG_UNAUTHORIZED" });
    await expect(
      store.cacheRemoteImage("https://image.tmdb.org/t/p/w500/a.jpg"),
    ).rejects.toMatchObject({ code: "PROVIDER_FAILED" });
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }

  const oversizedFixture = fixture(
    (async () =>
      new Response(tinyPng, {
        status: 200,
        headers: { "content-length": String(MAX_IMAGE_BYTES + 1) },
      })) as typeof fetch,
  );
  try {
    await expect(
      oversizedFixture.store.cacheRemoteImage(
        "https://image.tmdb.org/t/p/w500/large.png",
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_FAILED" });
  } finally {
    oversizedFixture.store.close();
    fs.rmSync(oversizedFixture.root, { recursive: true, force: true });
  }
});

test("M02 cache cancela download sem deixar arquivo parcial", async () => {
  const waitingFetch = (async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    })) as typeof fetch;
  const { root, store } = fixture(waitingFetch);
  try {
    const controller = new AbortController();
    const pending = store.cacheRemoteImage(
      "https://image.tmdb.org/t/p/w500/cancel.png",
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "PROVIDER_CANCELLED" });
    expect(
      fs
        .readdirSync(path.join(root, "cache"))
        .filter((name) => name.startsWith(".partial-")),
    ).toEqual([]);
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 cache valida magic bytes e persiste arte enviada sem expor path", () => {
  const { root, store } = fixture(fetch as typeof fetch);
  try {
    const encoded = Buffer.from(tinyPng).toString("base64");
    const uploaded = store.cacheUploadedImage(
      `data:image/png;base64,${encoded}`,
      "episodio.png",
      "image/png",
    );
    expect(uploaded).toMatchObject({
      fileName: "episodio.png",
      mediaType: "image/png",
      byteLength: tinyPng.length,
    });
    expect(uploaded.uri).toMatch(/^ushark-asset:\/\/[a-f0-9]{64}$/);
    expect(fs.readFileSync(store.resolveUri(uploaded.uri)!.path)).toEqual(
      Buffer.from(tinyPng),
    );
    expect(store.resolveUri(`${uploaded.uri}/`)?.assetId).toBe(
      uploaded.assetId,
    );
    expect(() =>
      store.cacheUploadedImage(
        `data:image/jpeg;base64,${encoded}`,
        "episodio.jpg",
        "image/jpeg",
      ),
    ).toThrow("corresponder");
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
