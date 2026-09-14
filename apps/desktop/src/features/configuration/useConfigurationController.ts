import { useEffect } from "react";
import { configurationError } from "../../../../../packages/types/src";
import type { Scenario } from "../../../../../packages/types/src";
import { useConfigurationStore } from "../../state/configuration.store";
import { useUiStore } from "../../state/ui.store";
import {
  useConfigurationQuery,
  useResetPlaybackMutation,
  useSaveConfigurationMutation,
} from "./configuration.queries";
import { useConfigurationService } from "./configuration.service";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function useConfigurationController() {
  const configuration = useConfigurationStore((state) => state.configuration);
  const hydrateConfiguration = useConfigurationStore((state) => state.hydrate);
  const acceptSaved = useConfigurationStore((state) => state.acceptSaved);
  const resetPreferences = useConfigurationStore(
    (state) => state.resetPreferences,
  );
  const route = useUiStore((state) => state.route);
  const navigate = useUiStore((state) => state.navigate);
  const setModal = useUiStore((state) => state.setModal);
  const setError = useUiStore((state) => state.setError);
  const setNotice = useUiStore((state) => state.setNotice);
  const setScenario = useUiStore((state) => state.setScenario);
  const clearFeedback = useUiStore((state) => state.clearFeedback);
  const service = useConfigurationService();
  const configurationQuery = useConfigurationQuery();
  const saveMutation = useSaveConfigurationMutation();
  const resetMutation = useResetPlaybackMutation();

  useEffect(() => {
    if (configurationQuery.data) {
      hydrateConfiguration(configurationQuery.data);
    }
  }, [configurationQuery.data, hydrateConfiguration]);

  useEffect(() => {
    if (configurationQuery.error) {
      setError(errorMessage(configurationQuery.error));
    }
  }, [configurationQuery.error, setError]);

  async function save() {
    const invalid = configurationError(configuration);
    if (invalid) {
      setError(invalid);
      return false;
    }

    clearFeedback();
    try {
      const saved = await saveMutation.mutateAsync(configuration);
      acceptSaved(saved);
      if (route === "onboarding") {
        navigate("home");
        window.location.hash = "/home";
      } else setNotice("Preferências atualizadas nesta sessão.");
      return true;
    } catch (error) {
      setError(errorMessage(error));
      return false;
    }
  }

  async function reset() {
    clearFeedback();
    try {
      const next = await resetMutation.mutateAsync();
      resetPreferences(next.preferences);
      setModal(null);
      setNotice(
        "Preferências de reprodução restauradas. Biblioteca e cache mantidos.",
      );
      return true;
    } catch (error) {
      setError(errorMessage(error));
      return false;
    }
  }

  function changeScenario(scenario: Scenario) {
    service.setScenario?.(scenario);
    setScenario(scenario);
  }

  return {
    busy: saveMutation.isPending || resetMutation.isPending,
    save,
    reset,
    changeScenario,
  };
}
