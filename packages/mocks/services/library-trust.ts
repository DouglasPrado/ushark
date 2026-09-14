import type {
  LibraryTrustPreview,
  TrustScenario,
  TrustResult,
} from "@ushark/types/library-trust";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import { previewWork } from "./library-package";
export class MockLibraryTrustPreview implements LibraryTrustPreview {
  readonly runtime = "mock" as const;
  capturePreview() {
    return structuredClone({ pins: this.pins });
  }
  restorePreview(value: ReturnType<MockLibraryTrustPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.pins = snapshot.pins;
  }

  private pins = new Map<string, string>();
  verify(
    snapshot: LibraryPackageSnapshot,
    scenario: TrustScenario,
    signal: AbortSignal,
  ) {
    return previewWork(signal, (): TrustResult => {
      if (scenario === "error")
        throw new Error("Verificação simulada indisponível. Tente novamente.");
      const key =
        scenario === "changed"
          ? "DEMO-PUBLIC-B"
          : (snapshot.signature?.key ?? "DEMO-PUBLIC-A");
      const previous = this.pins.get(snapshot.draft.id) ?? "";
      if (scenario === "invalid" || snapshot.signature?.valid === false)
        return {
          status: "invalid",
          key,
          previous,
          message: "Assinatura inválida · importação bloqueada (simulação).",
        };
      if (
        scenario === "hash" ||
        (snapshot.signature &&
          snapshot.signature.integrity !== snapshot.integrity)
      )
        return {
          status: "hash",
          key,
          previous,
          message: "Integridade divergente · importação bloqueada (simulação).",
        };
      if (["package", "offline"].includes(scenario) && !snapshot.signature)
        return {
          status: "unsigned",
          key: "",
          previous,
          message: "Não assinada. A identidade do autor não foi verificada.",
        };
      if (previous && previous !== key)
        return {
          status: "changed",
          key,
          previous,
          message:
            "Identidade alterada. Confira a nova chave antes de aceitar.",
        };
      return {
        status: previous ? "known" : "first",
        key,
        previous,
        message: previous
          ? "Assinatura válida; identidade lembrada nesta sessão (simulação)."
          : "Assinatura válida; primeira confiança nesta identidade (simulação).",
      };
    });
  }
  accept(
    id: string,
    key: string,
    scenario: TrustScenario,
    signal: AbortSignal,
  ) {
    return previewWork(signal, () => {
      if (scenario === "storage")
        throw new Error(
          "Armazenamento seguro indisponível na simulação; identidade não aceita.",
        );
      this.pins.set(id, key);
    });
  }
  sign(
    snapshot: LibraryPackageSnapshot,
    unavailable: boolean,
    signal: AbortSignal,
  ) {
    return previewWork(signal, () => {
      if (unavailable)
        throw new Error(
          "Armazenamento seguro indisponível; pacote continua não assinado.",
        );
      return {
        ...structuredClone(snapshot),
        signature: {
          algorithm: "Ed25519" as const,
          key: "DEMO-PUBLIC-A",
          integrity: snapshot.integrity,
          value: "DEMO-SIGNATURE",
          valid: true,
        },
      };
    });
  }
}
