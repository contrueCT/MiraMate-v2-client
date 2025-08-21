import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LLMConfig } from '@/core/types'
import { validateAndSanitizeLLMConfigs } from '@/core/services/configAdapter'

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
    /* ... */
  })

  // (UX增强) 新增一个状态来追踪配置的加载情况
  const configStatus = ref<'idle' | 'loaded' | 'partial' | 'error'>('idle')

  // --- Actions ---
  function loadSettingsFromServer(serverData: any) {
    // 接受任意类型的 serverData
    // 1. 处理 conversation 部分 (同样可以增加校验)
    if (serverData && typeof serverData.conversation === 'object') {
      conversation.value = { ...conversation.value, ...serverData.conversation }
    }

    // 2. 使用校验函数处理 LLM 配置
    const sanitized = validateAndSanitizeLLMConfigs(serverData?.llm)
    llmConfigs.value = sanitized

    // 3. 根据校验结果更新状态，以供UI显示提示
    if (!serverData?.llm) {
      configStatus.value = 'error' // 数据中完全没有llm字段
    } else if (Array.isArray(serverData.llm) && sanitized.length < serverData.llm.length) {
      configStatus.value = 'partial' // 原始数据比净化后的多，说明有部分被过滤掉了
    } else if (sanitized.length > 0) {
      configStatus.value = 'loaded' // 成功加载
    } else {
      configStatus.value = 'error' // 净化后为空，说明所有配置都无效
    }
  }

  async function saveSettingsToServer(newConfigs: {
    conversation: typeof conversation.value
    llm: LLMConfig[]
  }) {
    conversation.value = JSON.parse(JSON.stringify(newConfigs.conversation))
    llmConfigs.value = JSON.parse(JSON.stringify(newConfigs.llm))

    console.log('Settings to be sent to server:', newConfigs)
    // 未来在这里发起API请求
  }

  function savePreferences(draft: typeof preferences.value) {
    preferences.value = JSON.parse(JSON.stringify(draft))
  }

  return {
    conversation,
    llmConfigs,
    preferences,
    configStatus,
    loadSettingsFromServer,
    saveSettingsToServer,
    savePreferences,
  }
})
