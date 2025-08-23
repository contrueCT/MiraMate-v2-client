import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsStore } from './settings' // 导入 settings store
import { apiClient } from '@/core/services/apiClient'
import { webSocketService } from '@/core/services/socket'

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

  // [!] 修改点: 使用 watch 监听 endpointUrl 的变化
  watch(endpointUrl, (newUrl, oldUrl) => {
    // 只有当URL真的发生变化，并且新URL不为空时才操作
    if (newUrl && newUrl !== oldUrl) {
      console.log(`Endpoint URL changed to: ${newUrl}. Reconnecting WebSocket.`)
      // 调用连接，它内部会先关闭旧连接再创建新连接
      webSocketService.connect()
      const settingsStore = useSettingsStore()
      settingsStore.loadRemoteSettings()
    } else if (!newUrl && oldUrl) {
      console.log('Endpoint URL cleared. Disconnecting WebSocket.')
      webSocketService.disconnect()
    }
  })

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
    if (endpointUrl.value) {
      settingsStore.loadRemoteSettings()
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

  async function testConnection() {
    // 移除 config 参数
    connectionStatus.value = 'testing'
    connectionError.value = ''

    if (!endpointUrl.value) {
      // 直接从 state 读取
      connectionStatus.value = 'failed'
      connectionError.value = '服务地址不能为空。'
      return
    }

    try {
      // [!] 修改点: 调用 apiClient 进行健康检查
      // 注意：apiClient 会自动处理URL和Key，我们只需提供端点
      const health = await apiClient('/api/health')

      if ((health && health.status === 'healthy') || health.status === 'partial') {
        connectionStatus.value = 'success'
        // 连接成功后，可以触发加载服务器配置
        const settingsStore = useSettingsStore()
        settingsStore.loadRemoteSettings()
      } else {
        connectionStatus.value = 'failed'
        connectionError.value = `服务异常: ${health.status}`
      }
    } catch (error) {
      connectionStatus.value = 'failed'
      connectionError.value = '无法连接到服务，请检查URL和网络。'
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
