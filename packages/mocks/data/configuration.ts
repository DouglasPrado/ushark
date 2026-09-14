import type { Configuration, Preferences } from "@ushark/types";

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
