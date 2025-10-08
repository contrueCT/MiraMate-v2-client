import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsStore } from './settings' // 导入 settings store
import { apiClient } from '@/core/services/apiClient'
import { webSocketService } from '@/core/services/socket'
import { configStorage } from '@/platform/storage'

export const useServiceStore = defineStore('service', () => {
  // --- State ---
  const endpointUrl = ref<string>('')
  const authKey = ref<string>('')
  const environment = ref<'public' | 'local'>('public') // 默认为公网环境
  const connectionStatus = ref<'unconfigured' | 'testing' | 'success' | 'failed'>('unconfigured')
  const connectionError = ref<string>('')
  const wsConnected = ref<boolean>(false)

  // --- Actions ---

  // 使用 watch 监听 endpointUrl 的变化
  watch(endpointUrl, (newUrl, oldUrl) => {
    // 当URL真的发生变化，并且新URL不为空时才操作
    if (newUrl && newUrl !== oldUrl) {
      console.log(`Endpoint URL changed to: ${newUrl}. Reconnecting WebSocket.`)
      // 调用连接
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

    const configString = await configStorage.get()
    if (configString) {
      try {
        const parsedConfig = JSON.parse(configString)

        if (parsedConfig.service) {
          endpointUrl.value = parsedConfig.service.endpointUrl || ''
          authKey.value = parsedConfig.service.authKey || ''
          // 加载 environment 设置，如果不存在则保持默认值
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
    service: { url: string; key: string; env: 'public' | 'local' }
    preferences: any
  }) {
    endpointUrl.value = fullConfig.service.url
    authKey.value = fullConfig.service.key
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

    const result = await configStorage.set(configString)
    if (!result.success) {
      console.error('Failed to save app config:', result.error)
    }
  }

  async function testConnection() {
    connectionStatus.value = 'testing'
    connectionError.value = ''

    if (!endpointUrl.value) {
      connectionStatus.value = 'failed'
      connectionError.value = '服务地址不能为空。'
      return
    }

    try {
      // 测试连接（不带鉴权，避免 CORS 预检影响本地/内网调试）
      const health = await apiClient('/api/health', { __skipAuth: true })

      if ((health && health.status === 'healthy') || health.status === 'partial') {
        connectionStatus.value = 'success'
        // 连接成功后，触发加载服务器配置
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
    wsConnected,
    loadAppConfig,
    saveAppConfig,
    testConnection,
  }
})
