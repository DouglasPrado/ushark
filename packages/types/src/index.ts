import { z } from "zod";

export const scenarioSchema = z.enum([
  "normal",
  "loading",
  "offline",
  "error",
  "folder-error",
  "degraded",
]);

export const preferencesSchema = z.object({
  strategy: z.enum(["balanced", "quality", "fast"]),
  resolution: z.enum(["720p", "1080p", "2160p"]),
  audio: z.enum(["pt-BR", "en"]),
  subtitle: z.enum(["pt-BR", "en", "off"]),
  disconnect: z.enum(["pause", "continue"]),
  autoSelect: z.boolean(),
  autoSwitch: z.boolean(),
  autoplay: z.boolean(),
  preflight: z.boolean(),
  nextPreflight: z.boolean(),
});

export const configurationSchema = z
  .object({
    libraryId: z.string().trim().min(1, "A biblioteca precisa de um ID."),
    name: z
      .string()
      .trim()
      .min(1, "Dê um nome à biblioteca (até 80 caracteres).")
      .max(80, "Dê um nome à biblioteca (até 80 caracteres)."),
    libraryPath: z
      .string()
      .trim()
      .min(1, "Escolha as pastas da biblioteca e do cache."),
    cachePath: z
      .string()
      .trim()
      .min(1, "Escolha as pastas da biblioteca e do cache."),
    cacheGB: z
      .number()
      .int("Use um limite inteiro entre 1 e 10.000 GB.")
      .min(1, "Use um limite inteiro entre 1 e 10.000 GB.")
      .max(10000, "Use um limite inteiro entre 1 e 10.000 GB."),
    cleanup: z.boolean(),
    retainPartial: z.boolean(),
    preferences: preferencesSchema,
  })
  .superRefine((value, context) => {
    if (!value.libraryPath || !value.cachePath) {
      context.addIssue({
        code: "custom",
        message: "Escolha as pastas da biblioteca e do cache.",
        path: !value.libraryPath ? ["libraryPath"] : ["cachePath"],
      });
    }

    if (
      value.libraryPath &&
      value.cachePath &&
      value.libraryPath.toLowerCase() === value.cachePath.toLowerCase()
    ) {
      context.addIssue({
        code: "custom",
        message: "Escolha pastas diferentes para biblioteca e cache.",
        path: ["cachePath"],
      });
    }
  });

export type Scenario = z.infer<typeof scenarioSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Configuration = z.infer<typeof configurationSchema>;

export function configurationError(value: unknown): string | null {
  const result = configurationSchema.safeParse(value);
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Configuração inválida.");
}

export interface ConfigurationService {
  read(): Promise<Configuration>;
  save(value: Configuration): Promise<void>;
  resetPlayback(): Promise<Configuration>;
  setScenario?(scenario: Scenario): void;
}
