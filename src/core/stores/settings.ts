import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LLMConfig } from '@/core/types'
import { validateAndSanitizeLLMConfigs } from '@/core/services/configAdapter'
import { apiClient } from '@/core/services/apiClient'

// 为与后端交互的数据定义一个接口
interface ServerSettings {
  conversation: {
    aiName: string
    userAlias: string
    persona: string
  }
  // 现在直接使用LLMConfig数组
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

  // (UX增强) 新增一个状态来追踪配置的加载情况
  const configStatus = ref<'idle' | 'loaded' | 'partial' | 'error'>('idle')

  function loadPreferences(persistedPrefs: any) {
    // 使用 Object.assign 来合并，而不是完全替换，这样可以保留默认值以防某些字段丢失
    preferences.value = Object.assign({}, preferences.value, persistedPrefs)
  }

  // --- Actions ---
  async function loadSettingsFromServer() {
    try {
      // 1. 调用 apiClient 获取LLM配置
      const serverLLMConfig = await apiClient('/api/config/llm')

      // 2. 使用已有的校验和净化函数处理返回的数据
      const sanitized = validateAndSanitizeLLMConfigs(serverLLMConfig)
      llmConfigs.value = sanitized

      // 3. 根据结果更新加载状态
      if (!serverLLMConfig) {
        configStatus.value = 'error'
      } else if (Array.isArray(serverLLMConfig) && sanitized.length < serverLLMConfig.length) {
        configStatus.value = 'partial'
      } else if (sanitized.length > 0) {
        configStatus.value = 'loaded'
      } else {
        configStatus.value = 'error'
      }
    } catch (error) {
      console.error('Failed to load settings from server:', error)
      configStatus.value = 'error' // API请求失败，同样标记为错误
    }
  }

  async function saveSettingsToServer(newConfigs: {
    conversation: typeof conversation.value // conversation 实际在后端没有对应接口，但保留逻辑
    llm: LLMConfig[]
  }) {
    try {
      // [!] 修改点: 调用 apiClient 保存配置
      await apiClient('/api/config/llm', {
        method: 'POST',
        body: JSON.stringify(newConfigs.llm),
      })

      // 乐观更新
      llmConfigs.value = JSON.parse(JSON.stringify(newConfigs.llm))
      console.log('LLM settings saved to server successfully.')
    } catch (error) {
      console.error('Failed to save LLM settings to server:', error)
      // 可以在此显示一个错误提示
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
    loadSettingsFromServer,
    saveSettingsToServer,
    savePreferences,
  }
})
