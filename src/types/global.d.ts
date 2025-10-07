export {}

declare global {
  interface Window {
    electronAPI?: {
      getConfig: () => Promise<string | null>
      saveConfig: (cfg: string) => Promise<{ success: boolean; error?: string }>
      minimizeWindow?: () => void
      maximizeWindow?: () => void
      closeWindow?: () => void
      onWindowMaximized?: (cb: (max: boolean) => void) => void
      removeWindowMaximizedListener?: () => void
    }
    Capacitor?: any
  }

  const __MOBILE__: boolean
}

// 可选的 Capacitor 插件模块声明（用于动态导入时抑制 TS 报错）
declare module '@capacitor/preferences' {
  export const Preferences: {
    get(options: { key: string }): Promise<{ value: string | null }>
    set(options: { key: string; value: string }): Promise<void>
  }
}

declare module '@capacitor/local-notifications' {
  export const LocalNotifications: {
    requestPermissions(): Promise<{ display: 'granted' | 'denied' }>
    schedule(options: {
      notifications: Array<{
        id: number
        title: string
        body: string
        schedule?: { at?: Date }
      }>
    }): Promise<void>
  }
}
