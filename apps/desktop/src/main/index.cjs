const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
const desktopRoot = path.join(__dirname, "../..");
const dev = process.argv.includes("--dev");
const tv = process.argv.includes("--tv");
const devPort = Number(process.env.USHARK_DEV_PORT ?? 5173);
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#0f1113",
    fullscreen: tv && process.platform !== "darwin",
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: dev,
    },
  });
  // Keep TV mode on the current macOS desktop instead of creating a Space.
  if (tv && process.platform === "darwin") {
    window.once("ready-to-show", () => window.setSimpleFullScreen(true));
  }
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  if (dev) window.loadURL(`http://127.0.0.1:${devPort}${tv ? "?mode=tv" : ""}`);
  else
    window.loadFile(
      path.join(desktopRoot, "dist/index.html"),
      tv ? { query: { mode: "tv" } } : undefined,
    );
});
app.on("window-all-closed", () => app.quit());
