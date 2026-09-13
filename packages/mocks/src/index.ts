import type {
  Configuration,
  ConfigurationService,
  Preferences,
  Scenario,
} from "../../types/src/index";
export const defaults: Preferences = {
  strategy: "balanced",
  resolution: "2160p",
  audio: "pt-BR",
  subtitle: "pt-BR",
  disconnect: "pause",
  autoSelect: true,
  autoSwitch: false,
  autoplay: false,
  preflight: true,
  nextPreflight: false,
};
export const initial: Configuration = {
  libraryId: "library:mock-local",
  name: "Minha biblioteca",
  libraryPath: "C:\\TorrentStream\\Library",
  cachePath: "C:\\TorrentStream\\Cache",
  cacheGB: 100,
  cleanup: true,
  retainPartial: true,
  preferences: { ...defaults },
};
export function validate(value: Configuration): string | null {
  if (!value.name.trim() || value.name.length > 80)
    return "Dê um nome à biblioteca (até 80 caracteres).";
  if (!value.libraryPath.trim() || !value.cachePath.trim())
    return "Escolha as pastas da biblioteca e do cache.";
  if (
    value.libraryPath.trim().toLowerCase() ===
    value.cachePath.trim().toLowerCase()
  )
    return "Escolha pastas diferentes para biblioteca e cache.";
  if (
    !Number.isInteger(value.cacheGB) ||
    value.cacheGB < 1 ||
    value.cacheGB > 10000
  )
    return "Use um limite inteiro entre 1 e 10.000 GB.";
  return null;
}
export class MockConfigurationService implements ConfigurationService {
  private value = structuredClone(initial);
  scenario: Scenario = "normal";
  readonly personalData = {
    history: ["fixture-progress"],
    downloads: ["fixture-download"],
    subscriptions: ["fixture-library"],
  };
  async read() {
    await this.delay();
    return structuredClone(this.value);
  }
  async save(value: Configuration) {
    await this.delay();
    const error = validate(value);
    if (error) throw new Error(error);
    if (this.scenario === "error")
      throw new Error(
        "Não foi possível salvar. Suas escolhas continuam aqui. Tente novamente.",
      );
    if (this.scenario === "folder-error")
      throw new Error("Não foi possível acessar a pasta. Escolha outro local.");
    this.value = structuredClone(value);
  }
  async resetPlayback() {
    const next = {
      ...structuredClone(this.value),
      preferences: { ...defaults },
    };
    await this.save(next);
    return this.read();
  }
  private delay() {
    return new Promise((resolve) =>
      setTimeout(resolve, this.scenario === "loading" ? 2500 : 180),
    );
  }
}
