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
  // 添加消息存储API
  getMessages: (page: number, pageSize: number): Promise<any[]> =>
    ipcRenderer.invoke('messages:get', page, pageSize),
  saveMessages: (messages: any[]): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('messages:save', messages),
  getMessageCount: (): Promise<number> => ipcRenderer.invoke('messages:count'),
  clearMessages: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('messages:clear'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
