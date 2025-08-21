// src/components/settings/ModelSettings.vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import ModelCard from './ModelCard.vue'
import { frontendToBackend } from '@/core/services/configAdapter'

const draft = defineModel<any>('draft')

const isAdvancedMode = ref(false)

// 计算属性，用于在高级模式下显示JSON
const jsonConfig = computed({
  get() {
    try {
      // 实时将UI状态转换为格式化的JSON字符串
      return JSON.stringify(frontendToBackend(draft.value.models), null, 2)
    } catch (e) {
      return 'Error generating JSON.'
    }
  },
  set(newValue) {
    try {
      // 尝试解析用户输入的JSON，并更新回UI状态 (这里简化处理，实际可能需要更复杂的适配)
      const parsed = JSON.parse(newValue)
      // 注意：这里需要一个 `backendToFrontend` 来更新draft，为了简化，我们暂时只做单向绑定
      console.log('JSON updated, would need to parse and update draft state.', parsed)
    } catch (e) {
      // JSON格式错误，不做任何事
      console.error('Invalid JSON format')
    }
  },
})

const jsonTemplate = JSON.stringify(
  [
    {
      model: 'gpt-4o',
      api_key: 'YOUR_OPENAI_API_KEY',
      base_url: 'https://api.openai.com/v1',
      api_type: 'openai',
      model_kwargs: { temperature: 0.8 },
    },
  ],
  null,
  2,
)
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <button
        @click="isAdvancedMode = !isAdvancedMode"
        class="text-sm text-blue-500 hover:underline"
      >
        {{ isAdvancedMode ? '返回普通模式' : '高级JSON编辑' }}
      </button>
    </div>

    <!-- 普通模式 -->
    <div v-if="!isAdvancedMode" class="space-y-8">
      <ModelCard v-model:modelConfig="draft.models.primary" title="主模型" description="..." />
      <ModelCard v-model:modelConfig="draft.models.secondary" title="次要模型" description="..." />
    </div>

    <!-- 高级模式 -->
    <div v-else>
      <p class="text-sm text-gray-600 mb-2">直接编辑底层的JSON配置。格式不正确可能导致应用出错。</p>
      <textarea
        v-model="jsonConfig"
        rows="15"
        class="w-full font-mono text-sm p-2 border rounded-md"
      ></textarea>
      <details class="mt-2 text-sm">
        <summary class="cursor-pointer text-gray-500">查看JSON模板</summary>
        <pre class="bg-gray-100 p-2 rounded-md mt-1 text-xs">{{ jsonTemplate }}</pre>
      </details>
    </div>
  </div>
</template>
