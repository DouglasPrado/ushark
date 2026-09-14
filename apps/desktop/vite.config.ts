import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
const port = Number(process.env.USHARK_DEV_PORT ?? 5173);
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [tailwind()],
  server: { host: "127.0.0.1", port, strictPort: true },
});
