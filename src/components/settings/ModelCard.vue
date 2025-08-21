// src/components/settings/ModelCard.vue
<script setup lang="ts">
import { watch } from 'vue'
import type { UIModelConfig } from '@/core/types'

const modelConfig = defineModel<UIModelConfig>('modelConfig', { required: true })
defineProps<{ title: string; description: string }>()

// 监听接口类型的变化，智能处理baseUrl
watch(
  () => modelConfig.value.type,
  (newType) => {
    if (newType === 'Google Gemini') {
      // Gemini类型不需要base_url，可以清空以避免混淆
      modelConfig.value.baseUrl = ''
    }
  },
)
</script>
<template>
  <div class="p-4 border rounded-lg bg-white/50 space-y-4">
    <h3 class="text-lg font-bold">{{ title }}</h3>
    <p class="text-sm text-gray-600">{{ description }}</p>
    <div>
      <label class="font-semibold">接口类型</label>
      <select v-model="modelConfig.type" class="w-full mt-1 p-2 border rounded-md">
        <option>OpenAI 兼容接口</option>
        <option>Google Gemini</option>
      </select>
    </div>
    <!-- 条件渲染baseUrl输入框 -->
    <div v-if="modelConfig.type === 'OpenAI 兼容接口'">
      <label class="font-semibold">API 接口地址 (Base URL)</label>
      <input
        type="text"
        v-model="modelConfig.baseUrl"
        placeholder="https://api.siliconflow.cn/v1"
        class="w-full mt-1 p-2 border rounded-md"
      />
    </div>
    <div>
      <label class="font-semibold">API Key</label>
      <input
        type="password"
        v-model="modelConfig.apiKey"
        class="w-full mt-1 p-2 border rounded-md"
      />
    </div>
    <div>
      <label class="font-semibold">模型</label>
      <input
        type="text"
        v-model="modelConfig.modelName"
        placeholder="例如：Qwen/Qwen2-7B-Instruct"
        class="w-full mt-1 p-2 border rounded-md"
      />
    </div>
  </div>
</template>
