import type {
  Configuration,
  ConfigurationDirectoryKind,
  ConfigurationSaveOptions,
  ConfigurationService,
  Scenario,
} from "@ushark/types";
import { defaults, initial } from "../data/configuration";
import { scenarioDelay } from "../scenarios/timing";

export { defaults, initial } from "../data/configuration";
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
  capturePreview() {
    return structuredClone({ value: this.value });
  }
  restorePreview(
    value: ReturnType<MockConfigurationService["capturePreview"]>,
  ) {
    const snapshot = structuredClone(value);
    this.value = snapshot.value;
  }

  private value = structuredClone(initial);
  private completed = false;
  scenario: Scenario = "normal";
  readonly personalData = {
    history: ["fixture-progress"],
    downloads: ["fixture-download"],
    subscriptions: ["fixture-library"],
  };
  async read() {
    await this.delay();
    return this.snapshot();
  }
  async save(value: Configuration, options: ConfigurationSaveOptions = {}) {
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
    if (options.completeOnboarding) this.completed = true;
    return this.snapshot();
  }
  async resetPlayback() {
    const next = {
      ...structuredClone(this.value),
      preferences: { ...defaults },
    };
    await this.save(next);
    return this.read();
  }
  async chooseDirectory(kind: ConfigurationDirectoryKind) {
    return kind === "library" ? "D:\\Cinema\\Library" : "D:\\Cinema\\Cache";
  }
  private snapshot() {
    return structuredClone({
      schemaVersion: 1 as const,
      completed: this.completed,
      configuration: this.value,
    });
  }
  private delay() {
    return scenarioDelay(this.scenario === "loading", 180, 2500);
  }
}
