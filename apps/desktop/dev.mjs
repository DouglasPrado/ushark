import { createServer } from "vite";
import { spawn } from "node:child_process";
import electron from "electron";
const server = await createServer({
  configFile: "apps/desktop/vite.config.ts",
});
await server.listen();
const child = spawn(
  electron,
  ["apps/desktop/main.cjs", "--dev", ...process.argv.slice(2)],
  { stdio: "inherit" },
);
child.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
