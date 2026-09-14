import { test, expect } from "@playwright/test";
import { MockLibraryTrustPreview } from "@ushark/mocks/library-trust";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
test("M14 assinatura demonstrativa via roundtrip, divergência e cancelamento do pin", async () => {
  const trust = new MockLibraryTrustPreview(),
    packages = new MockLibraryPackagePreview();
  const signal = () => new AbortController().signal;
  const signed = await trust.sign(packages.fixture(), false, signal());
  const receiver = new MockLibraryPackagePreview();
  await receiver.commit(
    await receiver.stage(signed, "normal", signal()),
    "normal",
    signal(),
  );
  expect(
    (await trust.verify(receiver.received()[0], "package", signal())).status,
  ).toBe("first");
  const c = new AbortController();
  const pending = trust.accept(
    signed.draft.id,
    "DEMO-PUBLIC-A",
    "valid",
    c.signal,
  );
  c.abort();
  await expect(pending).rejects.toThrow("Cancelado");
  expect((await trust.verify(signed, "package", signal())).status).toBe(
    "first",
  );
  await trust.accept(signed.draft.id, "DEMO-PUBLIC-A", "valid", signal());
  expect((await trust.verify(signed, "package", signal())).status).toBe(
    "known",
  );
  expect(
    (
      await trust.verify(
        { ...signed, integrity: "alterado" },
        "package",
        signal(),
      )
    ).status,
  ).toBe("hash");
  await expect(trust.sign(signed, true, signal())).rejects.toThrow(
    "indisponível",
  );
  expect(JSON.stringify(signed)).not.toMatch(/private|secret|password/);
});
