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
  const endpointUrl = ref<string>('')
  const authKey = ref<string>('')
  const connectionStatus = ref<'unconfigured' | 'testing' | 'success' | 'failed'>('unconfigured')
  const connectionError = ref<string>('')

  // --- Actions ---

  /**
   * 从本地加载完整的应用配置
   */
  async function loadAppConfig() {
    const settingsStore = useSettingsStore() // 在action内部获取另一个store的实例

    const configString = await api.getConfig()
    if (configString) {
      try {
        const parsedConfig = JSON.parse(configString)

        // 1. 加载服务配置 (service部分)
        if (parsedConfig.service) {
          endpointUrl.value = parsedConfig.service.endpointUrl || ''
          authKey.value = parsedConfig.service.authKey || ''
        }

        // 2. 加载并分发应用偏好 (preferences部分)
        if (parsedConfig.preferences) {
          // 调用 settingsStore 的 action 来更新它的状态
          settingsStore.loadPreferences(parsedConfig.preferences)
        }
      } catch (e) {
        console.error('Failed to parse app config', e)
      }
    }
  }

  /**
   * 保存完整的应用配置
   */
  async function saveAppConfig(fullConfig: {
    service: { url: string; key: string }
    preferences: any
  }) {
    // 1. 更新自己的 state
    endpointUrl.value = fullConfig.service.url
    authKey.value = fullConfig.service.key

    // 2. 组合成完整的配置文件对象
    const configToSave = {
      service: {
        endpointUrl: fullConfig.service.url,
        authKey: fullConfig.service.key,
      },
      preferences: fullConfig.preferences,
    }

    const configString = JSON.stringify(configToSave, null, 2) // 格式化JSON，方便用户直接编辑文件

    const result = await api.saveConfig(configString)
    if (!result.success) {
      console.error('Failed to save app config:', result.error)
    }
  }

  /**
   * 连接测试
   */
  async function testConnection(config: { url: string; key: string }) {
    connectionStatus.value = 'testing'
    connectionError.value = ''

    if (!config.url) {
      connectionStatus.value = 'failed'
      connectionError.value = '服务地址不能为空。'
      return
    }

    try {
      // 假设后端有一个 /api/health 或类似的端点用于健康检查
      const response = await fetch(`${config.url}/api/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
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
    connectionStatus,
    connectionError,
    loadAppConfig, // 重命名
    saveAppConfig, // 重命名
    testConnection,
  }
})
