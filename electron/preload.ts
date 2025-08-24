import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getConfig: (): Promise<string | null> => ipcRenderer.invoke('config:get'),
  saveConfig: (configString: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('config:set', configString),
  // 添加窗口控制API
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  // 添加窗口状态监听
  onWindowMaximized: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_, isMaximized) => callback(isMaximized))
  },
  removeWindowMaximizedListener: () => {
    ipcRenderer.removeAllListeners('window:maximized')
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
