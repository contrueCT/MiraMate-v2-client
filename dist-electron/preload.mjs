"use strict";
const electron = require("electron");
const electronAPI = {
  getConfig: () => electron.ipcRenderer.invoke("config:get"),
  saveConfig: (configString) => electron.ipcRenderer.invoke("config:set", configString),
  // 添加窗口控制API
  minimizeWindow: () => electron.ipcRenderer.send("window:minimize"),
  maximizeWindow: () => electron.ipcRenderer.send("window:maximize"),
  closeWindow: () => electron.ipcRenderer.send("window:close"),
  // 添加窗口状态监听
  onWindowMaximized: (callback) => {
    electron.ipcRenderer.on("window:maximized", (_, isMaximized) => callback(isMaximized));
  },
  removeWindowMaximizedListener: () => {
    electron.ipcRenderer.removeAllListeners("window:maximized");
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
