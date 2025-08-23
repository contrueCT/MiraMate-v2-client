<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/core/stores/chat'
import { useRoute, useRouter } from 'vue-router'
import ChatHeader from '@/components/ChatHeader.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInputArea from '@/components/ChatInputArea.vue'
import type { Message } from '@/core/types' // 导入Message类型
import { webSocketService } from '@/core/services/socket'

const chatStore = useChatStore()
const { messages } = storeToRefs(chatStore)

const messageContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)

watch(
  () => messages.value[messages.value.length - 1]?.text,
  () => {
    scrollToBottom()
  },
)

// function handleSendMessage(inputText: string) {
//   if (!inputText.trim()) return

//   chatStore.addMessage({
//     sender: 'user',
//     text: inputText,
//   })

//   // [!] 修改点: 完整模拟新的状态流程
//   chatStore.setAIStatus('thinking')

//   // 模拟网络延迟和AI思考
//   setTimeout(() => {
//     chatStore.startAIStreamingResponse('正在为您生成') // 开始流式输出，状态变为 typing

//     let count = 0
//     const interval = setInterval(() => {
//       chatStore.appendToAIStreamingResponse(' ...' + count)
//       count++
//       if (count > 5) {
//         // 模拟流式输出结束
//         clearInterval(interval)
//         chatStore.finishAIStreamingResponse() // 流式输出完成，状态变为 processing

//         // 模拟同步后处理的耗时
//         setTimeout(() => {
//           chatStore.completeAIResponse() // 后处理完成，状态回归 idle
//         }, 1500) // 模拟1.5秒的后处理时间
//       }
//     }, 300)
//   }, 1000) // 模拟1秒的思考时间
// }

function handleSendMessage(inputText: string) {
  if (!inputText.trim()) return

  // 1. 立即更新UI和状态
  chatStore.addMessage({
    sender: 'user',
    text: inputText,
  })
  chatStore.setAIStatus('thinking')

  // 2. 调用 WebSocket 服务发送消息
  webSocketService.sendMessage(inputText)
}

const router = useRouter()
const route = useRoute()
const isSettingsOpen = computed(() => route.path.startsWith('/settings'))

// --- 新增：时间处理逻辑 ---

const TEN_MINUTES_IN_MS = 10 * 60 * 1000

/**
 * 判断是否需要为当前消息显示时间戳
 * @param currentMessage 当前消息
 * @param previousMessage 上一条消息 (可能为 undefined)
 */
function shouldShowTimestamp(currentMessage: Message, previousMessage?: Message): boolean {
  // 如果是第一条消息，总是显示
  if (!previousMessage) {
    return true
  }
  // 如果与上一条消息的时间差大于10分钟，显示
  if (currentMessage.timestamp - previousMessage.timestamp > TEN_MINUTES_IN_MS) {
    return true
  }
  return false
}

/**
 * 格式化时间戳为 HH:mm 格式
 * @param timestamp 毫秒时间戳
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
// ----------------------------
</script>

<template>
  <div
    class="relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-mira-bg-start to-mira-bg-end"
  >
    <ChatHeader @open-settings="router.push('/settings')" />

    <main ref="messageContainer" class="flex-grow overflow-y-auto p-4 space-y-2 pb-48">
      <!-- 
        核心改动在这里：
        - 我们使用 <template> 标签进行 v-for 循环，这样可以包裹多个元素（时间戳和消息气泡）。
        - 在循环中，我们获取 message 和 index。
        - v-if 指令调用我们新创建的 shouldShowTimestamp 函数来决定是否显示时间戳。
      -->
      <template v-for="(message, index) in messages" :key="message.id">
        <!-- 时间戳显示区域 -->
        <div
          v-if="shouldShowTimestamp(message, messages[index - 1])"
          class="text-center text-xs text-gray-500 py-2"
        >
          {{ formatTimestamp(message.timestamp) }}
        </div>

        <!-- 消息气泡本体 -->
        <MessageBubble :text="message.text" :sender="message.sender" />
      </template>
    </main>

    <div class="absolute bottom-0 left-0 right-0 p-4">
      <ChatInputArea @send-message="handleSendMessage" />
    </div>

    <RouterView v-slot="{ Component }">
      <Transition name="scale-fade">
        <component :is="Component" :key="route.path" v-if="isSettingsOpen" />
      </Transition>
    </RouterView>
  </div>
</template>
