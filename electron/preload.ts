import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getConfig: (): Promise<string | null> => ipcRenderer.invoke('config:get'),
  saveConfig: (configString: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('config:set', configString),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
