import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  configurationSchema,
  type Configuration,
} from "../../../../../packages/types/src";
import { useConfigurationService } from "./configuration.service";

export const configurationKeys = {
  all: ["configuration"] as const,
  current: () => [...configurationKeys.all, "current"] as const,
};

function parseConfiguration(value: unknown): Configuration {
  const result = configurationSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Configuração inválida recebida.",
    );
  }
  return result.data;
}

export function useConfigurationQuery() {
  const service = useConfigurationService();
  return useQuery({
    queryKey: configurationKeys.current(),
    queryFn: async () => parseConfiguration(await service.read()),
    staleTime: Infinity,
  });
}

export function useSaveConfigurationMutation() {
  const service = useConfigurationService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configuration: Configuration) => {
      const parsed = parseConfiguration(configuration);
      await service.save(parsed);
      return parsed;
    },
    onSuccess: (configuration) => {
      queryClient.setQueryData(configurationKeys.current(), configuration);
    },
  });
}

export function useResetPlaybackMutation() {
  const service = useConfigurationService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => parseConfiguration(await service.resetPlayback()),
    onSuccess: (configuration) => {
      queryClient.setQueryData(configurationKeys.current(), configuration);
    },
  });
}
