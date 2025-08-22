import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsStore } from './settings' // 导入 settings store

const api = window.electronAPI || {
  getConfig: async () => localStorage.getItem('mira-config'), // 文件名统一
  saveConfig: async (config: string) => {
    localStorage.setItem('mira-config', config)
    return { success: true }
  },
}

export const useServiceStore = defineStore('service', () => {
  // --- State ---
  // [修改 1/4]：在 State 中添加 environment 属性
  const endpointUrl = ref<string>('')
  const authKey = ref<string>('')
  const environment = ref<'public' | 'local'>('public') // 默认为公网环境
  const connectionStatus = ref<'unconfigured' | 'testing' | 'success' | 'failed'>('unconfigured')
  const connectionError = ref<string>('')

  // --- Actions ---

  async function loadAppConfig() {
    const settingsStore = useSettingsStore()

    const configString = await api.getConfig()
    if (configString) {
      try {
        const parsedConfig = JSON.parse(configString)

        if (parsedConfig.service) {
          endpointUrl.value = parsedConfig.service.endpointUrl || ''
          authKey.value = parsedConfig.service.authKey || ''
          // [修改 2/4]：加载 environment 设置，如果不存在则保持默认值
          environment.value = parsedConfig.service.environment || 'public'
        }

        if (parsedConfig.preferences) {
          settingsStore.loadPreferences(parsedConfig.preferences)
        }
      } catch (e) {
        console.error('Failed to parse app config', e)
      }
    }
  }

  async function saveAppConfig(fullConfig: {
    service: { url: string; key: string; env: 'public' | 'local' } // 增加 env
    preferences: any
  }) {
    endpointUrl.value = fullConfig.service.url
    authKey.value = fullConfig.service.key
    // [修改 3/4]：保存 environment 设置
    environment.value = fullConfig.service.env

    const configToSave = {
      service: {
        endpointUrl: fullConfig.service.url,
        authKey: fullConfig.service.key,
        environment: fullConfig.service.env,
      },
      preferences: fullConfig.preferences,
    }

    const configString = JSON.stringify(configToSave, null, 2)

    // ... 保存逻辑不变 ...
    const result = await api.saveConfig(configString)
    if (!result.success) {
      console.error('Failed to save app config:', result.error)
    }
  }

  async function testConnection(config: { url: string; key: string; env: 'public' | 'local' }) {
    // 增加 env
    connectionStatus.value = 'testing'
    connectionError.value = ''

    if (!config.url) {
      connectionStatus.value = 'failed'
      connectionError.value = '服务地址不能为空。'
      return
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // [修改 4/4]：只有在公网环境下才添加鉴权头
      if (config.env === 'public') {
        headers['Authorization'] = `Bearer ${config.key}`
      }

      const response = await fetch(`${config.url}/api/health`, {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        connectionStatus.value = 'success'
      } else if (response.status === 401 || response.status === 403) {
        connectionStatus.value = 'failed'
        connectionError.value = '鉴权密钥无效或无权限。'
      } else {
        connectionStatus.value = 'failed'
        connectionError.value = `服务器返回错误: ${response.status}`
      }
    } catch (error) {
      connectionStatus.value = 'failed'
      connectionError.value = '无法连接到服务地址，请检查URL和网络。'
    }
  }

  // 应用启动时自动加载配置
  loadAppConfig()

  return {
    endpointUrl,
    authKey,
    environment,
    connectionStatus,
    connectionError,
    loadAppConfig, // 重命名
    saveAppConfig, // 重命名
    testConnection,
  }
})
