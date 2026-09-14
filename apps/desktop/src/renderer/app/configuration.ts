import type {
  Configuration,
  ConfigurationDesktopApi,
  ConfigurationDirectoryKind,
  ConfigurationResult,
  ConfigurationSaveOptions,
  ConfigurationService,
  ConfigurationSnapshot,
  Scenario,
} from "@ushark/types";

function unwrap<T>(result: ConfigurationResult<T>): T {
  if (result.ok) return result.value;
  throw new Error(result.error.message);
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export class DesktopConfigurationService implements ConfigurationService {
  scenario: Scenario = "normal";
  readonly desktop = true;

  constructor(private readonly api: ConfigurationDesktopApi) {}

  async read(): Promise<ConfigurationSnapshot> {
    return unwrap(await this.api.read());
  }

  async save(
    value: Configuration,
    options: ConfigurationSaveOptions = {},
  ): Promise<ConfigurationSnapshot> {
    if (this.scenario === "loading") await delay(2500);
    if (this.scenario === "error")
      throw new Error(
        "Não foi possível salvar. Suas escolhas continuam aqui. Tente novamente.",
      );
    if (this.scenario === "folder-error")
      throw new Error("Não foi possível acessar a pasta. Escolha outro local.");
    return unwrap(await this.api.save(value, options));
  }

  async resetPlayback(): Promise<ConfigurationSnapshot> {
    if (this.scenario === "loading") await delay(2500);
    return unwrap(await this.api.resetPlayback());
  }

  async chooseDirectory(kind: ConfigurationDirectoryKind) {
    return unwrap(await this.api.chooseDirectory(kind));
  }
}
