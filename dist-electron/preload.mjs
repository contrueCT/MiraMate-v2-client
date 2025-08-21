"use strict";
const electron = require("electron");
const electronAPI = {
  getConfig: () => electron.ipcRenderer.invoke("config:get"),
  saveConfig: (configString) => electron.ipcRenderer.invoke("config:set", configString)
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
