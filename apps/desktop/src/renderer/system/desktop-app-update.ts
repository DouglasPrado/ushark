import type {
  AppUpdateDesktopApi,
  AppUpdatePreview,
  UpdateCandidate,
  UpdateChannel,
  UpdateScenario,
} from "@ushark/types/app-update";
export class DesktopAppUpdatePreview implements AppUpdatePreview {
  readonly runtime = "desktop" as const;
  version = "carregando";
  installed = true;
  constructor(private api: AppUpdateDesktopApi) {
    void api.state().then((r) => {
      if (r.ok) {
        this.version = r.value.version;
        this.installed = r.value.installed;
      }
    });
  }
  async check(
    channel: UpdateChannel,
    _scenario: UpdateScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.check({ channel });
    if (!r.ok) throw new Error(r.error.message);
    return r.value;
  }
  async apply(
    candidate: UpdateCandidate,
    _scenario: UpdateScenario,
    signal: AbortSignal,
    phase: (s: string) => void,
  ) {
    phase("Criando backup preventivo e baixando…");
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.apply({ candidate });
    if (!r.ok) throw new Error(r.error.message);
    phase("Candidato íntegro preparado para o instalador da plataforma.");
  }
  async uninstall(signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.uninstall();
    if (!r.ok) throw new Error(r.error.message);
  }
}
