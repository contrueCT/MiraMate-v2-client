// src/components/ChatHeader.vue
<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/core/stores/chat'
import { useSettingsStore } from '@/core/stores/settings'
import { useServiceStore } from '@/core/stores/service'
import IconSettings from '@/components/icons/IconSettings.vue'

const emit = defineEmits(['openSettings'])

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const serviceStore = useServiceStore()

const { aiStatus } = storeToRefs(chatStore)
const { wsConnected } = storeToRefs(serviceStore)
const { conversation } = storeToRefs(settingsStore)

const statusText = computed(() => {
  if (!wsConnected.value) return '离线'
  switch (aiStatus.value) {
    case 'thinking':
      return '正在思考...'
    case 'typing':
      return '正在输入中...'
    // [!] 修改点: 添加新的 case
    case 'processing':
      return '正在整理思绪...'
    case 'idle':
    default:
      return '在线'
  }
})
</script>

<template>
  <header
    class="flex-shrink-0 flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm z-10"
  >
    <div class="flex items-center space-x-3">
      <img src="@/assets/images/avatar.png" alt="Avatar" class="w-10 h-10 rounded-full" />
      <div>
        <!-- 从 settings store 读取AI名称 -->
        <h1 class="font-semibold text-gray-800">{{ conversation.aiName }}</h1>
        <p class="text-sm text-gray-600 flex items-center">
          <span
            class="w-2 h-2 rounded-full mr-1.5"
            :class="wsConnected ? 'bg-green-500' : 'bg-gray-400'"
          ></span>
          <!-- 显示动态计算的状态文本 -->
          {{ statusText }}
        </p>
      </div>
    </div>
    <button
      @click="emit('openSettings')"
      class="text-gray-500 hover:text-gray-800 transition-colors"
    >
      <IconSettings :size="24" />
    </button>
  </header>
</template>
