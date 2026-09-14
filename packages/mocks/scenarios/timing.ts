export function scenarioDelay(slow: boolean, normalMs: number, slowMs: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, slow ? slowMs : normalMs),
  );
}
