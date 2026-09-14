import { createServer } from "vite";
import { spawn } from "node:child_process";
import electron from "electron";
const server = await createServer({
  configFile: "apps/desktop/vite.config.ts",
});
await server.listen();
// IDE hosts can inherit Electron Node mode; always launch the desktop app.
const electronEnv = { ...process.env };
delete electronEnv.ELECTRON_RUN_AS_NODE;
const child = spawn(
  electron,
  ["apps/desktop/src/main/index.cjs", "--dev", ...process.argv.slice(2)],
  { stdio: "inherit", env: electronEnv },
);
child.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
