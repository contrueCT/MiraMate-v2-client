import { isCapacitor, isElectron } from './env'

const KEY = 'mira-config'

export interface ConfigStorage {
  get: () => Promise<string | null>
  set: (config: string) => Promise<{ success: boolean; error?: string }>
}

export const configStorage: ConfigStorage = (() => {
  if (isElectron) {
    return {
      get: () => (window as any).electronAPI.getConfig(),
      set: (config) => (window as any).electronAPI.saveConfig(config),
    }
  }

  // 运行在 Capacitor 原生容器内时优先使用 Preferences（按需在后续安装）
  if (isCapacitor) {
    // 延迟引入，避免 Web 环境打包错误
    return {
      get: async () => {
        try {
          const { Preferences } = await import('@capacitor/preferences')
          const { value } = await Preferences.get({ key: KEY })
          return value ?? null
        } catch {
          return localStorage.getItem(KEY)
        }
      },
      set: async (config) => {
        try {
          const { Preferences } = await import('@capacitor/preferences')
          await Preferences.set({ key: KEY, value: config })
          return { success: true }
        } catch (e: any) {
          try {
            localStorage.setItem(KEY, config)
            return { success: true }
          } catch (err: any) {
            return { success: false, error: String(err?.message || err) }
          }
        }
      },
    }
  }

  // Web 回退
  return {
    get: async () => localStorage.getItem(KEY),
    set: async (config) => {
      try {
        localStorage.setItem(KEY, config)
        return { success: true }
      } catch (e: any) {
        return { success: false, error: String(e?.message || e) }
      }
    },
  }
})()
