<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import ChatHeader from '@/components/ChatHeader.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInputArea from '@/components/ChatInputArea.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/core/stores/chat'

const chatStore = useChatStore()
// 使用 storeToRefs 来保持 ref 的响应性
const { messages } = storeToRefs(chatStore)

function handleSendMessage(inputText: string) {
  if (!inputText.trim()) return

  // 调用 store 的 action 来添加用户消息
  chatStore.addMessage({
    sender: 'user',
    text: inputText,
  })

  // (为第四阶段准备) 模拟AI思考和响应
  chatStore.setAIStatus('thinking')
  setTimeout(() => {
    chatStore.startAIStreamingResponse()
    let count = 0
    const interval = setInterval(() => {
      chatStore.appendToAIStreamingResponse(' ...' + count)
      count++
      if (count > 5) {
        clearInterval(interval)
        chatStore.finishAIStreamingResponse()
      }
    }, 300)
  }, 1000)
}

const route = useRoute()
const router = useRouter()

// 通过计算属性判断当前是否应显示设置页
const isSettingsOpen = computed(() => route.path.startsWith('/settings'))

function openSettings() {
  router.push('/settings')
}

// 定义消息的类型接口
interface Message {
  id: number
  text: string
  sender: 'ai' | 'user'
}

// ---------------------------------

// ---- 修复滚动逻辑 ----
const messageContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 监听messages数组的长度变化（新增/删除消息时触发）
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)

// 监听最后一条消息的文本变化（流式输出时触发）
watch(
  () => messages.value[messages.value.length - 1]?.text,
  () => {
    scrollToBottom()
  },
)
// ----------------------
</script>

<template>
  <!-- 1. 应用新的背景渐变色，并设置为相对定位的容器 -->
  <div
    class="relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-mira-bg-start to-mira-bg-end"
  >
    <ChatHeader @open-settings="openSettings" />

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

  <!-- 设置模态框 -->
  <RouterView v-slot="{ Component }">
    <Transition name="scale-fade">
      <component :is="Component" :key="route.path" v-if="isSettingsOpen" />
    </Transition>
  </RouterView>
</template>
