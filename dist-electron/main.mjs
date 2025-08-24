import { app, ipcMain, BrowserWindow } from "electron";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const userDataPath = app.getPath("userData");
const configFilePath = path.join(userDataPath, "config.json");
console.log("User data path:", userDataPath);
console.log("Config file will be saved to:", configFilePath);
ipcMain.handle("config:get", async () => {
  try {
    await fs.access(configFilePath);
    const data = await fs.readFile(configFilePath, "utf-8");
    return data;
  } catch (error) {
    return null;
  }
});
ipcMain.handle("config:set", async (event, configString) => {
  try {
    await fs.writeFile(configFilePath, configString, "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Failed to write config file:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.on("window:minimize", (event) => {
  console.log("Minimize window requested");
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});
ipcMain.on("window:close", (event) => {
  console.log("Close window requested");
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    frame: false,
    // 移除默认窗口边框
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  let windowMaximized = false;
  mainWindow.on("maximize", () => {
    console.log("Window maximized event triggered, sending to renderer");
    windowMaximized = true;
    mainWindow.webContents.send("window:maximized", true);
  });
  mainWindow.on("unmaximize", () => {
    console.log("Window unmaximized event triggered, sending to renderer");
    windowMaximized = false;
    mainWindow.webContents.send("window:maximized", false);
  });
  mainWindow.webContents.once("did-finish-load", () => {
    console.log("Page loaded, sending initial window state");
    const isMaximized = mainWindow.isMaximized();
    console.log("Initial window state:", isMaximized);
    windowMaximized = isMaximized;
    mainWindow.webContents.send("window:maximized", isMaximized);
  });
  const originalMaximizeHandler = ipcMain.listeners("window:maximize")[0];
  if (originalMaximizeHandler) {
    ipcMain.removeListener("window:maximize", originalMaximizeHandler);
  }
  ipcMain.on("window:maximize", (event) => {
    console.log("Maximize window requested");
    if (event.sender !== mainWindow.webContents) return;
    console.log("Window is currently maximized (tracked):", windowMaximized);
    if (windowMaximized) {
      console.log("Unmaximizing window");
      mainWindow.unmaximize();
    } else {
      console.log("Maximizing window");
      mainWindow.maximize();
    }
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    process.exit(0);
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
