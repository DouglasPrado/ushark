import { test, expect } from "@playwright/test";
import { MockSubscriptionPreview } from "@ushark/mocks/subscriptions";
import { MockLibraryPublishPreview } from "@ushark/mocks/library-publish";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
import { MockSelectionPreview } from "@ushark/mocks/selection";
import { MockPlayerPreview } from "@ushark/mocks/player";
test("M16 sync, referências pessoais e estados externos sobrevivem remoção/rollback", async () => {
  const publisher = new MockLibraryPublishPreview(),
    service = new MockSubscriptionPreview(publisher),
    packages = new MockLibraryPackagePreview(),
    selection = new MockSelectionPreview(),
    player = new MockPlayerPreview(),
    signal = () => new AbortController().signal;
  const snapshot = await service.resolve(
    "ushark://library/DEMO-CINEMA",
    "normal",
    signal(),
  );
  await service.install(snapshot, signal());
  await service.install(snapshot, signal());
  expect(service.list()).toHaveLength(1);
  const item = snapshot.catalog[0];
  service.savePersonal(item);
  service.toggleFavorite(item.id);
  selection.setOverride(item.id, item.sources[0].id);
  player.save(item.id, 123);
  const next = await service.check(snapshot.draft.id, "remove", signal());
  await service.apply(snapshot.draft.id, next!, "normal", signal(), () => {});
  expect(service.list()[0].snapshot.catalog).toHaveLength(0);
  service.rollback(snapshot.draft.id);
  expect(service.list()[0].snapshot.catalog).toHaveLength(1);
  service.unsubscribe(snapshot.draft.id);
  expect(service.discoveryItems()[0].favorite).toBe(true);
  expect(service.sources(item.id)).toEqual(item.sources);
  expect(selection.override(item.id)).toBe(item.sources[0].id);
  expect(player.progress(item.id)?.position).toBe(123);
  expect(service.discoveryItems()[0].memberships).toEqual([
    { id: "personal", name: "Minha biblioteca" },
  ]);
  const same = packages.fixture();
  same.draft.id = "other";
  await service.install(same, signal());
  expect(service.discoveryItems()).toHaveLength(1);
  expect(service.discoveryItems()[0].memberships).toHaveLength(2);
});
