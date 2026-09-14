import { test, expect } from "@playwright/test";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
test("M13 snapshot via catálogo receptor independente preserva layout e ignora edição posterior", async () => {
  const exporter = new MockLibraryPackagePreview(),
    receiver = new MockLibraryPackagePreview();
  const fixture = exporter.fixture();
  const snapshot = await exporter.export(
    fixture.draft,
    fixture.catalog,
    new AbortController().signal,
  );
  fixture.draft.name = "Mudou";
  fixture.draft.sections = [];
  const stage = await receiver.stage(
    snapshot,
    "offline",
    new AbortController().signal,
  );
  await receiver.commit(stage, "offline", new AbortController().signal);
  expect(receiver.received()[0].draft).toEqual(snapshot.draft);
  expect(receiver.received()[0].catalog).toEqual(snapshot.catalog);
  expect(receiver.received()[0].draft.name).toBe("Cinema portátil");
  const c = new AbortController();
  const pending = receiver.commit(
    { ...snapshot, key: "other" },
    "normal",
    c.signal,
  );
  c.abort();
  await expect(pending).rejects.toThrow("Cancelado");
  expect(receiver.received()).toHaveLength(1);
  expect(JSON.stringify(snapshot)).not.toMatch(
    /position|favorite|cachePath|password|token/,
  );
});
