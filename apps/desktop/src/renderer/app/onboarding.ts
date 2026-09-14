export const ONBOARDING_COMPLETED_KEY = "ushark.onboarding.completed.v1";

export function hasCompletedOnboarding(storage: Storage = window.localStorage) {
  try {
    return storage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(
  storage: Storage = window.localStorage,
) {
  storage.setItem(ONBOARDING_COMPLETED_KEY, "true");
}
