import { test, expect } from "@playwright/test";
import { MockLibraryPublishPreview } from "@ushark/mocks/library-publish";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
test("M15 concorrência, snapshots imutáveis e retirada não apaga instalação", async () => {
  const service = new MockLibraryPublishPreview(),
    receiver = new MockLibraryPackagePreview(),
    fixture = receiver.fixture(),
    signal = () => new AbortController().signal;
  const first = await service.prepare(fixture.draft, fixture.catalog, signal());
  await expect(
    service.publish(first, "normal", signal(), () => {}),
  ).rejects.toThrow("Entre");
  service.authenticated = true;
  const row = await service.publish(first, "normal", signal(), () => {});
  await receiver.commit(row.snapshot, "normal", signal());
  fixture.draft.name = "Mudou";
  expect(service.resolve(row.code)?.snapshot.draft.name).toBe(
    "Cinema portátil",
  );
  await expect(
    service.publish(first, "normal", signal(), () => {}),
  ).rejects.toThrow("Conflito");
  expect(service.list()).toHaveLength(1);
  await service.withdraw(fixture.draft.id, "normal", signal());
  expect(service.resolve(row.link)).toBeUndefined();
  expect(receiver.received()[0].draft.name).toBe("Cinema portátil");
});
