<script setup lang="ts">
import 'emoji-picker-element'
import { ref, computed } from 'vue' // 导入 computed
import { useChatStore } from '@/core/stores/chat' // 导入 chat store
import { storeToRefs } from 'pinia'

import IconMic from '@/components/icons/IconMic.vue'
import IconEmoji from '@/components/icons/IconEmoji.vue'
import IconImage from '@/components/icons/IconImage.vue'
import IconSend from '@/components/icons/IconSend.vue'

const inputText = ref('')
const emit = defineEmits(['sendMessage'])

// 引入 chatStore 并创建计算属性
const chatStore = useChatStore()
const { aiStatus } = storeToRefs(chatStore)

const isSendDisabled = computed(() => {
  // 按钮禁用的条件是：输入框为空，或者AI不处于空闲状态
  return !inputText.value.trim() || aiStatus.value !== 'idle'
})

const isPickerOpen = ref(false)

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function togglePicker() {
  isPickerOpen.value = !isPickerOpen.value
}

// 4. 定义处理 emoji 点击事件的函数
function onEmojiSelect(event: any) {
  const emoji = event.detail.unicode
  const textarea = textareaRef.value

  if (textarea) {
    // 获取当前光标位置
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // 将 emoji 插入到光标位置
    inputText.value = inputText.value.substring(0, start) + emoji + inputText.value.substring(end)

    // 更新光标位置到 emoji 后面
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length

    // 插入后让输入框重新获得焦点
    textarea.focus()
  }
}

function sendMessage() {
  if (!inputText.value.trim()) return
  emit('sendMessage', inputText.value)
  inputText.value = ''
}
</script>

<template>
  <!-- 5. 给父容器添加 position: relative，以便绝对定位picker -->
  <div
    class="relative w-full bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow-lg transition-all duration-300 focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-gray-300/50"
  >
    <!-- 6. 将 ref 绑定到 textarea 上 -->
    <textarea
      ref="textareaRef"
      v-model="inputText"
      placeholder="今天想聊点什么？"
      class="w-full h-16 bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400 pb-10"
      @keydown.enter.prevent="sendMessage"
    ></textarea>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between mt-1">
      <div class="text-gray-400 text-sm animate-pulse">... s ... i ...</div>

      <div class="flex items-center space-x-2">
        <button class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
          <IconMic :size="22" />
        </button>
        <!-- 7. 给Emoji按钮添加点击事件 -->
        <button
          @click="togglePicker"
          class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors"
        >
          <IconEmoji :size="22" />
        </button>
        <button class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
          <IconImage :size="22" />
        </button>
        <button
          @click="sendMessage"
          class="p-2 rounded-full transition-colors"
          :class="
            isSendDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'
          "
          :disabled="isSendDisabled"
        >
          <IconSend :size="22" />
        </button>
      </div>
    </div>

    <!-- 8. Emoji Picker 组件 -->
    <div v-if="isPickerOpen" class="absolute bottom-full right-0 mb-2">
      <emoji-picker class="light" @emoji-click="onEmojiSelect"></emoji-picker>
    </div>
  </div>
</template>
