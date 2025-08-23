import { useServiceStore } from '@/core/stores/service'
import { useChatStore } from '@/core/stores/chat'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0

  public connect() {
    const serviceStore = useServiceStore()
    const { endpointUrl, authKey, environment } = serviceStore

    if (!endpointUrl) {
      console.warn('WebSocket: Endpoint URL is not configured. Connection aborted.')
      return
    }

    // 将 http:// 或 https:// 替换为 ws:// 或 wss://
    const wsUrl = endpointUrl.replace(/^(http)/, 'ws') + '/ws'

    // 如果存在旧的连接，先关闭
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connection established.')
      this.reconnectAttempts = 0
      // 可以在这里发送一个心跳或认证消息（如果后端需要）
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`)
      // 实现简单的指数退避重连
      if (this.reconnectAttempts < 5) {
        const timeout = Math.pow(2, this.reconnectAttempts) * 1000
        console.log(`Attempting to reconnect in ${timeout / 1000}s...`)
        setTimeout(() => this.connect(), timeout)
        this.reconnectAttempts++
      } else {
        console.error('WebSocket reconnect attempts exhausted.')
      }
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)
      const chatStore = useChatStore()

      switch (message.type) {
        case 'chat_stream_start':
          // 后端已确认开始，前端状态应为 thinking 或 typing
          // 通常在发送消息时已设为thinking，这里可以不操作或设为typing
          chatStore.setAIStatus('typing')
          break

        case 'chat_stream_chunk':
          // 检查是否是第一块数据
          if (chatStore.messages[chatStore.messages.length - 1]?.isStreaming) {
            chatStore.appendToAIStreamingResponse(message.data.content)
          } else {
            chatStore.startAIStreamingResponse(message.data.content)
          }
          break

        case 'chat_response':
          // 流式结束后，元数据和完整响应会在这里。我们用它来触发后处理状态
          chatStore.finishAIStreamingResponse()
          break

        case 'chat_stream_end':
          // 整个流程完全结束
          chatStore.completeAIResponse()
          break

        case 'proactive_chat':
          // AI主动发起的聊天
          chatStore.addMessage({ sender: 'ai', text: message.data })
          break

        case 'error':
          console.error('Received error from WebSocket:', message.data)
          // 可以在这里添加一个action来在UI上显示错误消息
          chatStore.completeAIResponse() // 无论如何，结束当前轮次
          break

        default:
          console.warn('Received unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  public sendMessage(userMessage: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat',
        data: userMessage,
      }
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected. Cannot send message.')
      // 可以在这里提示用户连接已断开
    }
  }

  public disconnect() {
    if (this.ws) {
      this.reconnectAttempts = 999 // 防止自动重连
      this.ws.close()
    }
  }
}

// 导出一个单例
export const webSocketService = new WebSocketService()
