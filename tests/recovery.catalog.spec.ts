import { test, expect } from "@playwright/test";
import { MockRecoveryPreview } from "@ushark/mocks/recovery";
test("M21 restore atômico simulado conserva original em falha e cancelamento", async () => {
  let state = {
    config: { name: "A" },
    subscriptions: [{ id: "s", version: 1 }],
    progress: 123,
    downloads: [{ bytes: 50 }],
  };
  const service = new MockRecoveryPreview(
    () => state,
    (value) => {
      state = value;
    },
  );
  const backup = await service.create(
    "Seguro",
    "normal",
    new AbortController().signal,
  );
  state = { ...state, config: { name: "B" } };
  await expect(
    service.restore(
      backup.id,
      "migration",
      new AbortController().signal,
      () => {},
    ),
  ).rejects.toThrow("original preservada");
  expect(state.config.name).toBe("B");
  const c = new AbortController();
  const pending = service.restore(backup.id, "normal", c.signal, () => {});
  c.abort();
  await expect(pending).rejects.toThrow("Cancelado");
  expect(state.config.name).toBe("B");
  await service.restore(
    backup.id,
    "offline",
    new AbortController().signal,
    () => {},
  );
  expect(state.config.name).toBe("A");
  expect(state.progress).toBe(123);
  expect(state.downloads[0].bytes).toBe(50);
  const safety = service
    .list()
    .find((b) => b.name === "Segurança antes da restauração")!;
  await service.restore(
    safety.id,
    "normal",
    new AbortController().signal,
    () => {},
  );
  expect(state.config.name).toBe("B");
});
