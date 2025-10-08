import { useServiceStore } from '@/core/stores/service'
import { useChatStore } from '@/core/stores/chat'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private lifecycleListenersBound = false

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
      serviceStore.wsConnected = true
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      serviceStore.wsConnected = false
    }

    this.ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`)
      serviceStore.wsConnected = false
      // 简单的指数退避重连
      if (this.reconnectAttempts < 5) {
        const timeout = Math.pow(2, this.reconnectAttempts) * 1000
        console.log(`Attempting to reconnect in ${timeout / 1000}s...`)
        setTimeout(() => this.connect(), timeout)
        this.reconnectAttempts++
      } else {
        console.error('WebSocket reconnect attempts exhausted.')
      }
    }

    // 绑定通用生命周期监听（一次性）
    if (!this.lifecycleListenersBound) {
      this.bindLifecycleReconnect()
      this.lifecycleListenersBound = true
    }
  }

  private bindLifecycleReconnect() {
    const serviceStore = useServiceStore()

    const tryReconnect = () => {
      // 仅在有配置且未连接时触发重连
      const shouldConnect =
        !!serviceStore.endpointUrl && (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      if (shouldConnect) {
        console.log('[Lifecycle] Triggering reconnect...')
        this.connect()
      }
    }

    // 页面从后台回到前台
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        tryReconnect()
      }
    })

    // 网络从离线恢复到在线
    window.addEventListener('online', () => {
      tryReconnect()
    })
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)
      const chatStore = useChatStore()

      switch (message.type) {
        case 'chat_stream_start':
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
          // 触发后处理状态
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
          // TODO: 后期考虑在UI上显示错误
          chatStore.completeAIResponse()
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
    }
  }

  public disconnect() {
    if (this.ws) {
      this.reconnectAttempts = 999
      this.ws.close()
    }
  }
}

export const webSocketService = new WebSocketService()
