import { ref } from 'vue'
import { defineStore } from 'pinia'

// 直接访问 window.electronAPI (如果不存在，提供一个备用方案以便在纯浏览器中调试)
const api = window.electronAPI || {
  getConfig: async () => localStorage.getItem('mira-service-config'),
  saveConfig: async (config: string) => {
    localStorage.setItem('mira-service-config', config)
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

  async function loadServiceConfig() {
    const configString = await api.getConfig()
    if (configString) {
      try {
        const parsed = JSON.parse(configString)
        endpointUrl.value = parsed.endpointUrl || ''
        authKey.value = parsed.authKey || ''
        // 可以在这里根据加载到的配置更新 connectionStatus
        if (endpointUrl.value) {
          connectionStatus.value = 'unconfigured' // 标记为已配置但未测试
        }
      } catch (e) {
        console.error('Failed to parse service config from main process', e)
      }
    }
  }

  async function saveServiceConfig(config: { url: string; key: string }) {
    endpointUrl.value = config.url
    authKey.value = config.key

    const configString = JSON.stringify({
      endpointUrl: config.url,
      authKey: config.key,
    })

    const result = await api.saveConfig(configString)
    if (!result.success) {
      console.error('Failed to save config via main process:', result.error)
      // 可以在这里向用户显示一个保存失败的提示
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
  loadServiceConfig()

  return {
    endpointUrl,
    authKey,
    connectionStatus,
    connectionError,
    loadServiceConfig,
    saveServiceConfig,
    testConnection,
  }
})
