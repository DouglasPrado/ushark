import { test, expect } from "@playwright/test";
import { MockLibraryForkPreview } from "@ushark/mocks/library-fork";
import { MockLibraryPreviewService } from "@ushark/mocks/libraries";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
test("M17 novo ID, referências iguais e cópia isolada/cancelamento atômico", async () => {
  const libraries = new MockLibraryPreviewService(async () => []),
    fork = new MockLibraryForkPreview(libraries),
    source = new MockLibraryPackagePreview().fixture();
  const copy = await fork.copy(
    source,
    "Cópia",
    true,
    "normal",
    new AbortController().signal,
  );
  expect(copy.id).not.toBe(source.draft.id);
  expect(copy.memberships).toEqual(source.draft.memberships);
  expect(copy.collections[0].items).toEqual(source.draft.collections[0].items);
  source.draft.name = "Atualizada";
  source.catalog = [];
  expect(libraries.list()[0].name).toBe("Cópia");
  expect(await libraries.catalog()).toHaveLength(1);
  const c = new AbortController();
  const pending = fork.copy(source, "Cancelada", false, "normal", c.signal);
  c.abort();
  await expect(pending).rejects.toThrow("Cancelado");
  expect(libraries.list()).toHaveLength(1);
});
