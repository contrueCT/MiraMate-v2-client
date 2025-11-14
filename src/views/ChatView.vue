<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/core/stores/chat'
import { useRoute, useRouter } from 'vue-router'
import WindowControls from '@/components/WindowControls.vue'
import { isElectron } from '@/platform/env'
import ChatHeader from '@/components/ChatHeader.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInputArea from '@/components/ChatInputArea.vue'
import type { Message } from '@/core/types'
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

// 保留旧的模拟函数以供参考
// function handleSendMessage(inputText: string) {
//   if (!inputText.trim()) return

//   chatStore.addMessage({
//     sender: 'user',
//     text: inputText,
//   })

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

  // 立即更新UI和状态
  chatStore.addMessage({
    sender: 'user',
    text: inputText,
  })
  chatStore.setAIStatus('thinking')

  // 调用 WebSocket 服务发送消息
  webSocketService.sendMessage(inputText)
}

const router = useRouter()
const route = useRoute()
const isSettingsOpen = computed(() => route.path.startsWith('/settings'))

// 时间处理逻辑

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
    class="relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-mira-bg-start to-mira-bg-end rounded-window"
  >
    <!-- 窗口控制按钮（仅桌面端 Electron 渲染） -->
    <WindowControls v-if="isElectron" />

    <!-- 间距 -->
    <div class="pt-2"></div>

    <ChatHeader @open-settings="router.push('/settings')" />

    <main ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-2">
      <template v-for="(message, index) in messages" :key="message.id">
        <!-- 时间戳显示区域 -->
        <div
          v-if="shouldShowTimestamp(message, messages[index - 1])"
          class="text-center text-xs text-gray-500 py-2"
        >
          {{ formatTimestamp(message.timestamp) }}
        </div>

        <!-- 消息气泡本体 -->
        <MessageBubble
          :text="message.text"
          :sender="message.sender"
          :is-streaming="message.isStreaming"
        />
      </template>
      <!-- 底部占位，确保最后一条消息不被输入框遮挡 -->
      <div class="h-4"></div>
    </main>

    <div class="flex-shrink-0 p-4 bg-gradient-to-br from-mira-bg-start to-mira-bg-end">
      <ChatInputArea @send-message="handleSendMessage" />
    </div>

    <RouterView v-slot="{ Component }">
      <Transition name="scale-fade">
        <component :is="Component" :key="route.path" v-if="isSettingsOpen" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
/* 全局圆角样式 */
.rounded-window {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
