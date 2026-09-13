const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
const dev = process.argv.includes("--dev");
const tv = process.argv.includes("--tv");
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
    backgroundColor: "#10130f",
    fullscreen: tv,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: dev,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  if (dev) window.loadURL("http://127.0.0.1:5173");
  else window.loadFile(path.join(__dirname, "dist/index.html"));
});
app.on("window-all-closed", () => app.quit());
