import type {
  Configuration,
  ConfigurationService,
  Preferences,
  Scenario,
} from "../../types/src/index";
import { configurationError } from "../../types/src/index";
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
  libraryPath: "C:\\Ushark\\Library",
  cachePath: "C:\\Ushark\\Cache",
  cacheGB: 100,
  cleanup: true,
  retainPartial: true,
  preferences: { ...defaults },
};
export function validate(value: Configuration): string | null {
  return configurationError(value);
}
export class MockConfigurationService implements ConfigurationService {
  private value = structuredClone(initial);
  scenario: Scenario = "normal";
  readonly personalData = {
    history: ["fixture-progress"],
    downloads: ["fixture-download"],
    subscriptions: ["fixture-library"],
  };
  setScenario(scenario: Scenario) {
    this.scenario = scenario;
  }
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
