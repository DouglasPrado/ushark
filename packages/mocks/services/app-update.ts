import type {
  AppUpdatePreview,
  UpdateCandidate,
  UpdateChannel,
  UpdateScenario,
} from "@ushark/types/app-update";
import type { RecoveryPreview } from "@ushark/types/recovery";
import { previewWork } from "./library-package";
export class MockAppUpdatePreview implements AppUpdatePreview {
  readonly runtime = "mock" as const;
  version = "0.1.0-demo";
  installed = true;
  constructor(private recovery: RecoveryPreview) {}
  check(channel: UpdateChannel, scenario: UpdateScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      if (scenario === "offline")
        throw new Error(
          "Offline: verificação de atualização indisponível. Versão atual preservada.",
        );
      if (
        (this.version === "0.2.0-demo" && this.installed) ||
        scenario === "current"
      )
        return null;
      return {
        version: "0.2.0-demo",
        checksum: "DEMO-ARTIFACT-002",
        channel,
        platform: "Windows x64 (alvo simulado)",
        notes: [
          "Jornadas frontend M01–M22 para revisão",
          "Dados da sessão preservados na simulação",
        ],
        signature: "Verificação demonstrativa; sem code signing real",
        sbom: "Não disponível: nenhum installer real produzido",
        provenance: "Build local de desenvolvimento; attestation real pendente",
      };
    });
  }
  async apply(
    candidate: UpdateCandidate,
    scenario: UpdateScenario,
    signal: AbortSignal,
    phase: (s: string) => void,
  ) {
    phase("Baixando candidato simulado…");
    await previewWork(
      signal,
      () => {
        if (scenario === "download-error" || scenario === "offline")
          throw new Error("Download simulado interrompido. Tente novamente.");
      },
      500,
    );
    phase("Verificando assinatura e integridade simuladas…");
    await previewWork(
      signal,
      () => {
        const errors: Partial<Record<UpdateScenario, string>> = {
          signature: "Assinatura inválida; aplicação bloqueada.",
          hash: "Checksum divergente; aplicação bloqueada.",
          incompatible:
            "Plataforma ou schema incompatível; aplicação bloqueada.",
        };
        if (errors[scenario]) throw new Error(errors[scenario]);
      },
      400,
    );
    phase("Criando backup preventivo da sessão…");
    await this.recovery.create(
      "Antes da atualização simulada",
      "normal",
      signal,
    );
    phase("Aplicando atualização simulada…");
    await previewWork(
      signal,
      () => {
        if (scenario === "migration")
          throw new Error(
            "Migração simulada falhou. Versão anterior preservada e backup disponível.",
          );
        this.version = candidate.version;
        this.installed = true;
      },
      500,
    );
  }
  uninstall(signal: AbortSignal) {
    return previewWork(signal, () => {
      this.installed = false;
    });
  }
}
