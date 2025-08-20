import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

// 定义模型设置的接口，方便复用
export interface ModelConfig {
  type: 'OpenAI 兼容接口' | 'Google Gemini'
  baseUrl: string
  apiKey: string
  modelName: string
}

export const useSettingsStore = defineStore('settings', () => {
  // --- 默认值 ---
  const defaultConversation = {
    aiName: '小梦',
    userAlias: '',
    persona: '你是一个乐于助人、友好且充满同理心的AI助手。',
  }
  const defaultPrimaryModel: ModelConfig = {
    type: 'OpenAI 兼容接口',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    modelName: 'Qwen/Qwen2-7B-Instruct',
  }
  const defaultSecondaryModel: ModelConfig = {
    type: 'OpenAI 兼容接口',
    baseUrl: '',
    apiKey: '',
    modelName: '',
  }
  const defaultPreferences = {
    theme: '跟随系统' as '浅色' | '深色' | '跟随系统',
    language: '简体中文',
    enableNotifications: true,
  }

  // --- State ---
  const conversation = ref(JSON.parse(JSON.stringify(defaultConversation)))
  const primaryModel = ref(JSON.parse(JSON.stringify(defaultPrimaryModel)))
  const secondaryModel = ref(JSON.parse(JSON.stringify(defaultSecondaryModel)))
  const preferences = ref(JSON.parse(JSON.stringify(defaultPreferences)))

  // --- Actions ---
  function saveSettings(draft: {
    conversation: typeof conversation.value
    primaryModel: ModelConfig
    secondaryModel: ModelConfig
    preferences: typeof preferences.value
  }) {
    conversation.value = JSON.parse(JSON.stringify(draft.conversation))
    primaryModel.value = JSON.parse(JSON.stringify(draft.primaryModel))
    secondaryModel.value = JSON.parse(JSON.stringify(draft.secondaryModel))
    preferences.value = JSON.parse(JSON.stringify(draft.preferences))
    // TODO: 在这里可以添加持久化逻辑，如写入localStorage或Electron store
  }

  function resetConversationSettings() {
    conversation.value = JSON.parse(JSON.stringify(defaultConversation))
  }

  // --- Theme Watcher ---
  // 监听主题变化并立即应用到<html>标签
  watch(
    preferences,
    (newPrefs) => {
      // 实际的主题切换逻辑
    },
    { immediate: true, deep: true },
  )

  return {
    conversation,
    primaryModel,
    secondaryModel,
    preferences,
    saveSettings,
    resetConversationSettings,
  }
})
