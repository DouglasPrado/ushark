import { test, expect } from "@playwright/test";
import { MockLibraryPreviewService } from "@ushark/mocks/libraries";
import { MockRecoveryPreview } from "@ushark/mocks/recovery";
import { MockAppUpdatePreview } from "@ushark/mocks/app-update";
import { MockDownloadPreview } from "@ushark/mocks/downloads";
test("M12 M21 restaurar snapshot não reutiliza identidade criada depois do backup", async () => {
  const library = new MockLibraryPreviewService(async () => []);
  const first = library.create();
  first.name = "Primeira";
  await library.save(first, new AbortController().signal);
  const snapshot = library.capturePreview();
  const later = library.create();
  library.restorePreview(snapshot);
  const third = library.create();
  expect(new Set([first.id, later.id, third.id]).size).toBe(3);
  expect(library.list()[0].name).toBe("Primeira");
});
test("M21 M22 atualização, falha e uninstall preservam snapshot e backup recuperável", async () => {
  let state = {
    library: ["id-1"],
    cache: [12],
    position: 321,
    downloads: [{ id: "d", bytes: 456 }],
    preferences: { audio: "en" },
  };
  const recovery = new MockRecoveryPreview(
    () => state,
    (v) => {
      state = v;
    },
  );
  const update = new MockAppUpdatePreview(recovery);
  const signal = new AbortController().signal;
  const before = structuredClone(state);
  const candidate = (await update.check("Canary", "normal", signal))!;
  expect((await update.check("Stable", "normal", signal))?.checksum).toBe(
    candidate.checksum,
  );
  await expect(
    update.apply(candidate, "migration", signal, () => {}),
  ).rejects.toThrow("preservada");
  expect(state).toEqual(before);
  expect(update.version).toBe("0.1.0-demo");
  await update.apply(candidate, "normal", signal, () => {});
  await update.uninstall(signal);
  expect(state).toEqual(before);
  expect(update.installed).toBe(false);
  state = { ...state, position: 999 };
  await recovery.restore(recovery.list()[0].id, "normal", signal, () => {});
  expect(state).toEqual(before);
});
test("M09 limites de sessões, downloads e probes exigem inteiros", () => {
  const downloads = new MockDownloadPreview();
  for (const key of ["sessions", "concurrent", "probes"])
    expect(() =>
      downloads.setLimits({ ...downloads.limits, [key]: 1.5 }),
    ).toThrow();
});
