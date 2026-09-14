import type {
  RecoveryPreview,
  RecoveryScenario,
  BackupSummary,
} from "@ushark/types/recovery";
import { previewWork } from "./library-package";
export class MockRecoveryPreview<T> implements RecoveryPreview {
  readonly runtime = "mock" as const;
  private backups = new Map<string, { summary: BackupSummary; data: T }>();
  private count = 0;
  private attempts = new Map<string, number>();
  constructor(
    private capture: () => T,
    private apply: (snapshot: T) => void,
  ) {}
  list() {
    return structuredClone([...this.backups.values()].map((b) => b.summary));
  }
  private check(scenario: RecoveryScenario) {
    const messages: Partial<Record<RecoveryScenario, string>> = {
      invalid: "Backup inválido; original preservado.",
      incompatible:
        "Backup incompatível; atualize o leitor antes de restaurar.",
      locked: "DB ocupado na simulação; feche a operação e tente novamente.",
      full: "Sem espaço na simulação; original preservado.",
      migration: "Migração simulada falhou; versão original preservada.",
      partial: "Falha parcial no staging; original preservado.",
    };
    if (messages[scenario]) throw new Error(messages[scenario]);
  }
  private store(name: string, data: T) {
    const summary = {
      id: `backup-${++this.count}`,
      name,
      created: new Date().toISOString(),
      parts: [
        "Configuração",
        "Catálogo e curadorias",
        "Assinaturas e pins públicos demonstrativos",
        "Estado pessoal e progresso",
        "Fila/resume e política de cache",
      ],
    };
    this.backups.set(summary.id, { summary, data: structuredClone(data) });
    return structuredClone(summary);
  }
  create(name: string, scenario: RecoveryScenario, signal: AbortSignal) {
    return previewWork(
      signal,
      () => {
        this.check(scenario);
        return this.store(name.trim() || "Backup da sessão", this.capture());
      },
      600,
    );
  }
  validate(id: string, scenario: RecoveryScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      this.check(scenario);
      const backup = this.backups.get(id);
      if (!backup) throw new Error("Backup não encontrado nesta sessão.");
      return structuredClone(backup.summary);
    });
  }
  async restore(
    id: string,
    scenario: RecoveryScenario,
    signal: AbortSignal,
    phase: (p: string) => void,
  ) {
    const backup = this.backups.get(id);
    if (!backup) throw new Error("Backup não encontrado.");
    const data = structuredClone(backup.data);
    phase("Validando backup…");
    await previewWork(signal, () => this.check(scenario), 300);
    phase("Preparando restauração…");
    await previewWork(signal, () => this.check(scenario), 400);
    phase("Aplicando snapshot…");
    await previewWork(
      signal,
      () => {
        this.check(scenario);
        this.store("Segurança antes da restauração", this.capture());
        this.apply(data);
      },
      400,
    );
  }
  restart(component: string, fail: boolean, signal: AbortSignal) {
    return previewWork(
      signal,
      () => {
        const tries = this.attempts.get(component) ?? 0;
        if (tries >= 3)
          throw new Error(
            "Limite de 3 tentativas atingido. Continuar degradado ou rearmar explicitamente.",
          );
        this.attempts.set(component, tries + 1);
        if (fail)
          throw new Error(
            `Recuperação de ${component} falhou (${tries + 1}/3), estado confirmado preservado.`,
          );
        this.attempts.set(component, 0);
        return `${component} recuperado na simulação. Nenhum processo real reiniciado.`;
      },
      500,
    );
  }
  rearm(component: string) {
    this.attempts.delete(component);
  }
  async shutdown(fail: boolean, signal: AbortSignal) {
    await previewWork(
      signal,
      () => {
        if (fail)
          throw new Error(
            "Timeout simulado de shutdown; aplicativo continua disponível.",
          );
        this.store("Shutdown simulado", this.capture());
      },
      800,
    );
  }
}
