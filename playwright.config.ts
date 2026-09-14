import { defineConfig } from "@playwright/test";

const port = Number(process.env.USHARK_DEV_PORT ?? 5173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev:web",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
