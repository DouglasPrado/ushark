import { create, type StateCreator } from "zustand";
import { createStore } from "zustand/vanilla";
import { initial } from "../../../../packages/mocks/src";
import type {
  Configuration,
  Preferences,
} from "../../../../packages/types/src";

export type ConfigurationState = {
  configuration: Configuration;
  hydrated: boolean;
  dirty: boolean;
  hydrate: (configuration: Configuration) => void;
  acceptSaved: (configuration: Configuration) => void;
  updateConfiguration: <Key extends keyof Configuration>(
    key: Key,
    value: Configuration[Key],
  ) => void;
  updatePreference: <Key extends keyof Preferences>(
    key: Key,
    value: Preferences[Key],
  ) => void;
  resetPreferences: (preferences: Preferences) => void;
};

const createConfigurationState =
  (initialConfiguration: Configuration): StateCreator<ConfigurationState> =>
  (set) => ({
    configuration: structuredClone(initialConfiguration),
    hydrated: false,
    dirty: false,
    hydrate: (configuration) =>
      set((state) => {
        if (state.hydrated) return state;
        return state.dirty
          ? { hydrated: true }
          : {
              configuration: structuredClone(configuration),
              hydrated: true,
            };
      }),
    acceptSaved: (configuration) =>
      set({
        configuration: structuredClone(configuration),
        hydrated: true,
        dirty: false,
      }),
    updateConfiguration: (key, value) =>
      set((state) => ({
        configuration: { ...state.configuration, [key]: value },
        dirty: true,
      })),
    updatePreference: (key, value) =>
      set((state) => ({
        configuration: {
          ...state.configuration,
          preferences: { ...state.configuration.preferences, [key]: value },
        },
        dirty: true,
      })),
    resetPreferences: (preferences) =>
      set((state) => ({
        configuration: {
          ...state.configuration,
          preferences: structuredClone(preferences),
        },
        dirty: state.dirty,
      })),
  });

export function createConfigurationStore(initialConfiguration = initial) {
  return createStore<ConfigurationState>()(
    createConfigurationState(initialConfiguration),
  );
}

export const useConfigurationStore = create<ConfigurationState>()(
  createConfigurationState(initial),
);
