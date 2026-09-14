import { create } from "zustand";
import type { Scenario } from "../../../../packages/types/src";

export type AppRoute = "onboarding" | "home" | "settings";
export type AppModal = "libraryPath" | "cachePath" | "reset" | null;

type UiState = {
  route: AppRoute;
  step: number;
  modal: AppModal;
  scenario: Scenario;
  advanced: boolean;
  error: string;
  notice: string;
  navigate: (route: AppRoute) => void;
  setStep: (step: number) => void;
  setModal: (modal: AppModal) => void;
  setScenario: (scenario: Scenario) => void;
  setAdvanced: (advanced: boolean) => void;
  setError: (error: string) => void;
  setNotice: (notice: string) => void;
  clearFeedback: () => void;
};

const clearFeedback = { error: "", notice: "" };

export const useUiStore = create<UiState>((set) => ({
  route: "onboarding",
  step: 0,
  modal: null,
  scenario: "normal",
  advanced: false,
  ...clearFeedback,
  navigate: (route) => set({ route, ...clearFeedback }),
  setStep: (step) => set({ step }),
  setModal: (modal) => set({ modal }),
  setScenario: (scenario) => set({ scenario, error: "" }),
  setAdvanced: (advanced) => set({ advanced }),
  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
  clearFeedback: () => set(clearFeedback),
}));
