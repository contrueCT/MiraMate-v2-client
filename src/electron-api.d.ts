// 这是一个全局类型声明文件
export interface IElectronAPI {
  getConfig: () => Promise<string | null>
  saveConfig: (configString: string) => Promise<{ success: boolean; error?: string }>

  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void

  onWindowMaximized: (callback: (isMaximized: boolean) => void) => void
  removeWindowMaximizedListener: () => void

  // 消息存储API
  getMessages: (page: number, pageSize: number) => Promise<any[]>
  saveMessages: (messages: any[]) => Promise<{ success: boolean; error?: string }>
  getMessageCount: () => Promise<number>
  clearMessages: () => Promise<{ success: boolean; error?: string }>
}

// 全局的 Window 接口
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
