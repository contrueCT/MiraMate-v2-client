import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LLMConfig } from '@/core/types'
import { validateAndSanitizeLLMConfigs } from '@/core/services/configAdapter'
import { apiClient } from '@/core/services/apiClient'

// 定义后端通信数据接口
interface ServerSettings {
  conversation: {
    aiName: string
    userAlias: string
    persona: string
  }
  llm: LLMConfig[]
}

export const useSettingsStore = defineStore('settings', () => {
  // --- State ---
  const conversation = ref({ aiName: '小梦', userAlias: '', persona: '' })
  const llmConfigs = ref<LLMConfig[]>([])
  const preferences = ref({
    theme: '跟随系统' as '浅色' | '深色' | '跟随系统',
    language: '简体中文',
    enableNotifications: true,
  })

  const configStatus = ref<'idle' | 'loaded' | 'partial' | 'error'>('idle')

  function loadPreferences(persistedPrefs: any) {
    // 使用 Object.assign 来合并，而不是完全替换，这样可以保留默认值以防某些字段丢失
    preferences.value = Object.assign({}, preferences.value, persistedPrefs)
  }

  // --- Actions ---
  /**
   * 统一的、加载所有远程配置的 action
   */
  async function loadRemoteSettings() {
    try {
      // 使用 Promise.all 并行发起两个API请求
      const [llmResponse, envResponse] = await Promise.all([
        apiClient('/api/config/llm'),
        apiClient('/api/config/environment'),
      ])

      // --- 处理 LLM 配置 ---
      const sanitized = validateAndSanitizeLLMConfigs(llmResponse)
      llmConfigs.value = sanitized

      // 更新LLM配置的加载状态
      if (!llmResponse) {
      } else if (Array.isArray(llmResponse) && sanitized.length < llmResponse.length) {
        configStatus.value = 'partial'
      } else if (sanitized.length > 0) {
        configStatus.value = 'loaded'
      } else {
        configStatus.value = 'error'
      }

      // --- 处理 Environment (对话设定) 配置 ---
      if (envResponse) {
        conversation.value = {
          aiName: envResponse.agent_name || '小梦',
          userAlias: envResponse.user_name || '小伙伴',
          persona: envResponse.agent_description || '',
        }
      }
    } catch (error) {
      console.error('Failed to load remote settings from server:', error)
      configStatus.value = 'error'
    }
  }

  /**
   * 创建一个统一的、保存所有远程配置的 action
   */
  async function saveRemoteSettings(draft: {
    conversation: typeof conversation.value
    llm: LLMConfig[]
  }) {
    // 1. 准备后端需要的数据格式
    const environmentConfigPayload = {
      agent_name: draft.conversation.aiName,
      user_name: draft.conversation.userAlias,
      agent_description: draft.conversation.persona,
    }

    const llmConfigPayload = draft.llm

    try {
      // 2. 乐观更新：立即更新本地 store
      conversation.value = JSON.parse(JSON.stringify(draft.conversation))
      llmConfigs.value = JSON.parse(JSON.stringify(llmConfigPayload))

      console.log('Saving remote settings to server...')

      // 3. 使用 Promise.all 并行发起两个保存请求
      await Promise.all([
        apiClient('/api/config/environment', {
          method: 'POST',
          body: JSON.stringify(environmentConfigPayload),
        }),
        apiClient('/api/config/llm', {
          method: 'POST',
          body: JSON.stringify(llmConfigPayload),
        }),
      ])

      console.log('Remote settings saved successfully.')
      // TODO: 这里触发一个全局的成功通知
    } catch (error) {
      console.error('Failed to save remote settings:', error)
      // TODO: 这里触发一个全局的失败通知, 或乐观更新的回滚
    }
  }

  function savePreferences(draft: typeof preferences.value) {
    preferences.value = JSON.parse(JSON.stringify(draft))
  }

  return {
    conversation,
    llmConfigs,
    preferences,
    loadPreferences,
    configStatus,
    loadRemoteSettings,
    saveRemoteSettings,
    savePreferences,
  }
})
