<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/core/stores/chat'

const draft = defineModel<any>('draft')
const chatStore = useChatStore()
const isClearing = ref(false)

async function clearChatHistory() {
  if (!confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) {
    return
  }
  
  isClearing.value = true
  try {
    await chatStore.clearAllMessages()
    alert('聊天记录已清空')
  } catch (error) {
    console.error('Failed to clear messages:', error)
    alert('清空失败，请重试')
  } finally {
    isClearing.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- 外观区块 -->
    <div class="space-y-6">
      <h3 class="text-lg md:text-lg font-bold border-b pb-2">外观</h3>
      <div class="flex items-center justify-between">
        <label class="font-semibold">主题</label>
        <!-- 分段控件 -->
        <div class="flex bg-gray-200 p-1 rounded-md">
          <button
            v-for="theme in ['浅色', '深色', '跟随系统']"
            :key="theme"
            @click="draft.preferences.theme = theme"
            :class="[
              'px-4 py-2 md:px-3 md:py-1 text-sm rounded-md transition-colors',
              draft.preferences.theme === theme ? 'bg-white shadow' : '',
            ]"
          >
            {{ theme }}
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <label class="font-semibold">语言</label>
        <select v-model="draft.preferences.language" class="p-3 md:p-2 border rounded-md">
          <option>简体中文</option>
          <option>English</option>
        </select>
      </div>
    </div>
    <!-- 通知区块 -->
    <div class="space-y-6">
      <h3 class="text-lg font-bold border-b pb-2">通知</h3>
      <div class="flex items-center justify-between">
        <label class="font-semibold">接收新消息通知</label>
        <!-- 开关 -->
        <button
          @click="draft.preferences.enableNotifications = !draft.preferences.enableNotifications"
          :class="[
            'w-14 h-7 md:w-12 md:h-6 rounded-full p-1 transition-colors',
            draft.preferences.enableNotifications ? 'bg-blue-500' : 'bg-gray-300',
          ]"
        >
          <div
            :class="[
              'w-5 h-5 md:w-4 md:h-4 bg-white rounded-full shadow transition-transform',
              draft.preferences.enableNotifications ? 'translate-x-7 md:translate-x-6' : '',
            ]"
          ></div>
        </button>
      </div>
    </div>
    <!-- 数据管理区块 -->
    <div class="space-y-6">
      <h3 class="text-lg font-bold border-b pb-2">数据管理</h3>
      <div class="flex items-center justify-between">
        <div>
          <label class="font-semibold block">清空聊天记录</label>
          <p class="text-sm text-gray-600 mt-1">删除本地存储的所有聊天记录</p>
        </div>
        <button
          @click="clearChatHistory"
          :disabled="isClearing"
          class="px-4 py-2 md:px-3 md:py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isClearing ? '清空中...' : '清空记录' }}
        </button>
      </div>
    </div>
  </div>
</template>
