// 这是一个全局类型声明文件

// 导入我们在 preload.ts 中定义的 API 的类型
// 这样 TypeScript 就能知道 window.electronAPI 上有哪些方法和它们的签名
export interface IElectronAPI {
  getConfig: () => Promise<string | null>
  saveConfig: (configString: string) => Promise<{ success: boolean; error?: string }>
}

// 扩展全局的 Window 接口
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
