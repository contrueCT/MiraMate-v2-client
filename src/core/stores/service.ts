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
  // 测试锁：连接测试进行中时，暂不触发 WebSocket 连接，避免干扰后端日志与判断
  const testingLock = ref<boolean>(false)

  // --- Actions ---

  // 使用 watch 监听 endpointUrl 的变化
  watch(endpointUrl, (newUrl, oldUrl) => {
    // 当URL真的发生变化，并且新URL不为空时才操作
    if (newUrl && newUrl !== oldUrl) {
      console.log(`Endpoint URL changed to: ${newUrl}. Reconnecting WebSocket.`)
      // 测试中不触发 WS 连接，避免后端出现 Invalid HTTP request 日志
      if (!testingLock.value) {
        // 强制重连：确保切换到新地址
        webSocketService.connect(true)
      }
      const settingsStore = useSettingsStore()
      settingsStore.loadRemoteSettings()
    } else if (!newUrl && oldUrl) {
      console.log('Endpoint URL cleared. Disconnecting WebSocket.')
      webSocketService.disconnect()
    }
  })

  // 监听 authKey 变化：在公网环境下需要携带 token，变更后强制重连以更新连接 URL
  watch(authKey, (newKey, oldKey) => {
    if (newKey !== oldKey) {
      if (!testingLock.value && endpointUrl.value) {
        console.log('Auth key changed. Forcing WebSocket reconnect.')
        webSocketService.connect(true)
      }
    }
  })

  // 监听 environment 变化：公网/本地切换需要调整是否携带 token
  watch(environment, (newEnv, oldEnv) => {
    if (newEnv !== oldEnv) {
      if (!testingLock.value && endpointUrl.value) {
        console.log(`Environment changed (${oldEnv} -> ${newEnv}). Forcing WebSocket reconnect.`)
        webSocketService.connect(true)
      }
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

  /**
   * 使用外部提供的草稿参数进行连接测试（不保存、不改变 store 值、不建立 WS）。
   */
  async function testConnectionWithOverride(params: {
    url: string
    key: string
    env: 'public' | 'local'
  }) {
    connectionStatus.value = 'testing'
    connectionError.value = ''
    testingLock.value = true

    const testUrl = (params.url || '').trim()
    const testEnv = params.env
    const testKey = (params.key || '').trim()

    if (!testUrl) {
      connectionStatus.value = 'failed'
      connectionError.value = '服务地址不能为空。'
      testingLock.value = false
      return
    }

    try {
      // 1) 健康检查（不带鉴权）——直接用 fetch，避免拼接依赖 store.endpointUrl
      console.log(
        '[TestOverride] Hitting health endpoint:',
        `${testUrl.replace(/\/+$/, '')}/api/health`,
      )
      let healthOk = false
      try {
        const res = await fetch(`${testUrl.replace(/\/+$/, '')}/api/health`)
        if (res.ok) {
          const json = await res.json()
          healthOk = json && (json.status === 'healthy' || json.status === 'partial')
        }
      } catch (e) {
        // 尝试尾斜杠
        try {
          const res2 = await fetch(`${testUrl.replace(/\/+$/, '')}/api/health/`)
          if (res2.ok) {
            const json2 = await res2.json()
            healthOk = json2 && (json2.status === 'healthy' || json2.status === 'partial')
          }
        } catch (_) {}
      }

      if (!healthOk) {
        connectionStatus.value = 'failed'
        connectionError.value = '无法连接到服务，请检查URL和网络。'
        return
      }

      // 2) 公网环境下验证鉴权：手动带 Authorization
      if (testEnv === 'public') {
        try {
          const res = await fetch(`${testUrl.replace(/\/+$/, '')}/api/config/environment`, {
            headers: { Authorization: `Bearer ${testKey}` },
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } catch (err) {
          connectionStatus.value = 'failed'
          connectionError.value = '鉴权失败：请检查鉴权密钥是否正确或是否有权限。'
          return
        }
      }

      // 3) 均通过 => 标记成功（不加载远端配置、不建立 WS）
      connectionStatus.value = 'success'
    } catch (error) {
      connectionStatus.value = 'failed'
      connectionError.value = '无法连接到服务，请检查URL和网络。'
    } finally {
      testingLock.value = false
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
    // testingLock 不导出到外部，仅用于内部控制 WS 连接时机
    loadAppConfig,
    saveAppConfig,
    testConnectionWithOverride,
  }
})
