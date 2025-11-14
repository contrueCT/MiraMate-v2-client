// src/core/stores/chat.ts
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Message, AIStatus } from '@/core/types'
import { messageStorage } from '@/core/services/messageStorage'

// 分页配置
const PAGE_SIZE = 50 // 每次加载50条消息

export const useChatStore = defineStore('chat', () => {
  // --- State ---
  const messages = ref<Message[]>([])
  const aiStatus = ref<AIStatus>('idle')
  
  // 分页相关状态
  const currentPage = ref(0) // 当前已加载的页数（0表示最新一页）
  const hasMoreMessages = ref(false) // 是否还有更多历史消息
  const isLoadingMessages = ref(false) // 是否正在加载消息

  // 自动保存消息的防抖定时器
  let saveTimer: ReturnType<typeof setTimeout> | null = null

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

  /**
   * 保存消息到本地存储（带防抖）
   */
  function saveMessagesToStorage() {
    // 清除之前的定时器
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    
    // 设置新的定时器，500ms后保存
    saveTimer = setTimeout(async () => {
      try {
        await messageStorage.saveMessages(messages.value)
      } catch (error) {
        console.error('Failed to save messages:', error)
      }
    }, 500)
  }

  /**
   * 从本地存储加载初始消息（最新一页）
   */
  async function loadInitialMessages() {
    if (isLoadingMessages.value) return
    
    isLoadingMessages.value = true
    try {
      const loadedMessages = await messageStorage.getMessages(0, PAGE_SIZE)
      messages.value = loadedMessages
      
      // 检查是否还有更多消息
      const totalCount = await messageStorage.getMessageCount()
      hasMoreMessages.value = totalCount > PAGE_SIZE
      currentPage.value = 0
    } catch (error) {
      console.error('Failed to load initial messages:', error)
    } finally {
      isLoadingMessages.value = false
    }
  }

  /**
   * 加载更多历史消息（向前翻页）
   */
  async function loadMoreMessages() {
    if (isLoadingMessages.value || !hasMoreMessages.value) return
    
    isLoadingMessages.value = true
    try {
      const nextPage = currentPage.value + 1
      const olderMessages = await messageStorage.getMessages(nextPage, PAGE_SIZE)
      
      if (olderMessages.length > 0) {
        // 在现有消息前面插入更早的消息
        messages.value = [...olderMessages, ...messages.value]
        currentPage.value = nextPage
        
        // 检查是否还有更多
        const totalCount = await messageStorage.getMessageCount()
        hasMoreMessages.value = totalCount > (nextPage + 1) * PAGE_SIZE
      } else {
        hasMoreMessages.value = false
      }
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      isLoadingMessages.value = false
    }
  }

  /**
   * 清空所有消息
   */
  async function clearAllMessages() {
    messages.value = []
    currentPage.value = 0
    hasMoreMessages.value = false
    await messageStorage.clearMessages()
  }

  // 监听消息变化，自动保存到本地
  // 使用 deep watch 可以同时监听数组长度和内容变化
  watch(
    messages,
    () => {
      if (messages.value.length > 0) {
        saveMessagesToStorage()
      }
    },
    { deep: true },
  )

  return {
    messages,
    aiStatus,
    hasMoreMessages,
    isLoadingMessages,
    addMessage,
    startAIStreamingResponse,
    appendToAIStreamingResponse,
    finishAIStreamingResponse,
    completeAIResponse,
    setAIStatus,
    loadInitialMessages,
    loadMoreMessages,
    clearAllMessages,
  }
})
