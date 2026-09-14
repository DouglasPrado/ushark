import { test, expect } from "@playwright/test";
import { MockLibraryPreviewService } from "@ushark/mocks/libraries";
test("M12 preserva IDs, ordem e isolamento; snapshot não contém dados pessoais", async () => {
  const service = new MockLibraryPreviewService(async () => []);
  const draft = service.create();
  draft.name = "Curadoria";
  draft.memberships = [
    { contentId: "one", sourceIds: ["source"], titleOverride: "Escopo" },
  ];
  draft.collections = [
    { id: "c2", name: "Segunda", items: ["one"] },
    { id: "c1", name: "Primeira", items: [] },
  ];
  draft.sections = [
    { id: "s2", title: "Pessoal", type: "continue", collectionId: "" },
    { id: "s1", title: "Hero", type: "hero", collectionId: "c2" },
  ];
  const saved = await service.save(draft, new AbortController().signal);
  draft.collections.reverse();
  expect(service.list()[0]).toEqual(saved);
  expect(saved.collections.map((c) => c.id)).toEqual(["c2", "c1"]);
  expect(JSON.stringify(saved)).not.toMatch(
    /position|favorite|cachePath|magnet|token|download/,
  );
  const cancel = new AbortController();
  const pending = service.save({ ...saved, name: "Cancelado" }, cancel.signal);
  cancel.abort();
  await expect(pending).rejects.toThrow("Cancelado");
  expect(service.list()[0].name).toBe("Curadoria");
  await expect(
    service.save({ ...saved, revision: 0 }, new AbortController().signal),
  ).rejects.toThrow("Revisão alterada");
});
