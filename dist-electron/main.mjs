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
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: path.join(__dirname, "preload.mjs")
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
