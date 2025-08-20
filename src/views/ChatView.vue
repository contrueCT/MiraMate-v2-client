<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import ChatHeader from '@/components/ChatHeader.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInputArea from '@/components/ChatInputArea.vue'

// 定义消息的类型接口
interface Message {
  id: number
  text: string
  sender: 'ai' | 'user'
}

// ---- 使用静态假数据来构建UI ----
const messages = ref<Message[]>([
  { id: 1, text: 'Oh?', sender: 'ai' },
  { id: 2, text: 'Cool', sender: 'ai' },
  { id: 3, text: 'How does it work?', sender: 'ai' },
  { id: 4, text: "No honestly I'm thinking of a career pivot", sender: 'user' },
  { id: 5, text: 'This is the main chat template', sender: 'user' },
  { id: 6, text: 'Simple', sender: 'user' },
  {
    id: 7,
    text: "You just edit any text to type in the conversation you want to show, and delete any bubbles you don't want to use",
    sender: 'user',
  },
  { id: 8, text: 'Boom', sender: 'user' },
])
// ---------------------------------

// 用于自动滚动的逻辑
const messageContainer = ref<HTMLElement | null>(null)

// 监听消息数组的变化，当有新消息时，自动滚动到底部
watch(
  messages,
  () => {
    // nextTick 确保DOM更新后再执行滚动
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { deep: true },
) // deep watch 保证能监听到数组push

// 处理发送新消息的函数
function handleSendMessage(inputText: string) {
  if (!inputText.trim()) return // 忽略空消息

  messages.value.push({
    id: Date.now(),
    text: inputText,
    sender: 'user',
  })

  // TODO: 在这里可以模拟AI回复
}
</script>

<template>
  <!-- 1. 应用新的背景渐变色，并设置为相对定位的容器 -->
  <div
    class="relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-mira-bg-start to-mira-bg-end"
  >
    <ChatHeader />

    <!-- 2. 中间消息列表 -->
    <!-- pb-48: 增加底部内边距，为悬浮的输入框留出空间，防止内容被遮挡 -->
    <main ref="messageContainer" class="flex-grow overflow-y-auto p-4 space-y-4 pb-48">
      <div class="text-center text-xs text-gray-400">Nov 30, 2023, 9:41 AM</div>

      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :text="message.text"
        :sender="message.sender"
      />
    </main>

    <!-- 3. 底部输入区域 -->
    <!-- 使用绝对定位实现悬浮效果 -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <ChatInputArea @send-message="handleSendMessage" />
    </div>
  </div>
</template>
