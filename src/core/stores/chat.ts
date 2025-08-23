// src/core/stores/chat.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Message, AIStatus } from '@/core/types'

export const useChatStore = defineStore('chat', () => {
  // --- State ---
  const messages = ref<Message[]>([])
  const aiStatus = ref<AIStatus>('idle')

  // --- Actions ---

  /**
   * 添加一条新消息到聊天记录
   * @param message 消息对象
   */
  function addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    messages.value.push({
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    })
  }

  /**
   * AI开始流式响应
   * @param initialText - 可选的初始文本
   */
  function startAIStreamingResponse(initialText: string = '') {
    aiStatus.value = 'typing'
    messages.value.push({
      id: crypto.randomUUID(),
      sender: 'ai',
      text: initialText,
      timestamp: Date.now(),
      isStreaming: true,
    })
  }

  /**
   * 向当前正在流式传输的消息追加内容
   * @param chunk - 新的数据块
   */
  function appendToAIStreamingResponse(chunk: string) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.isStreaming) {
      lastMessage.text += chunk
    }
  }

  /**
   * 结束AI的流式响应，但进入后处理阶段
   */
  function finishAIStreamingResponse() {
    aiStatus.value = 'processing' // 状态变为 processing，而不是 idle
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.isStreaming) {
      lastMessage.isStreaming = false
    }
  }

  /**
   * 彻底完成AI的响应流程
   */
  function completeAIResponse() {
    aiStatus.value = 'idle' // 状态最终回归 idle
  }

  function setAIStatus(status: AIStatus) {
    aiStatus.value = status
  }

  return {
    messages,
    aiStatus,
    addMessage,
    startAIStreamingResponse,
    appendToAIStreamingResponse,
    finishAIStreamingResponse,
    completeAIResponse, // 导出新 action
    setAIStatus,
  }
})
