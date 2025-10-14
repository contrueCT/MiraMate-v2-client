import { useServiceStore } from '@/core/stores/service'
import { useChatStore } from '@/core/stores/chat'
import { createAuthedWebSocket } from './wsClient'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private lifecycleListenersBound = false
  private keepAliveTimer: number | null = null
  private lastConnectTs = 0

  public connect(force: boolean = false) {
    const serviceStore = useServiceStore()
    const { endpointUrl, authKey, environment } = serviceStore

    if (!endpointUrl) {
      console.warn('WebSocket: Endpoint URL is not configured. Connection aborted.')
      return
    }

    // 若已有连接且处于 OPEN 或 CONNECTING，避免重复发起连接，减少抖动
    if (this.ws) {
      if (force) {
        try {
          this.ws.close()
        } catch {}
        this.ws = null
      } else {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket already open/connecting. Skip connect.')
          return
        }
        // 对于 CLOSING/CLOSED，清理引用，稍后重新创建
        try {
          this.ws.close()
        } catch {}
        this.ws = null
      }
    }

    // 简易节流：避免在极短时间内重复 connect（移动端前后台切换/网络抖动时尤为常见）
    const now = Date.now()
    if (!force && now - this.lastConnectTs < 1500) {
      console.log('WebSocket connect debounced.')
      return
    }
    this.lastConnectTs = now

    // 使用统一的带鉴权 WS 客户端
    this.ws = createAuthedWebSocket('/ws')

    this.ws.onopen = () => {
      console.log('WebSocket connection established.')
      this.reconnectAttempts = 0
      serviceStore.wsConnected = true

      // 启动心跳保活：浏览器不支持原生 ping 帧，使用应用层 ping/pong
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer)
      }
      this.keepAliveTimer = window.setInterval(() => {
        try {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }))
          }
        } catch (e) {
          // 发送异常忽略；等待 onclose/onerror 触发重连
        }
      }, 25000)
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
      // 清理保活定时器
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer)
        this.keepAliveTimer = null
      }
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
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer)
        this.keepAliveTimer = null
      }
      this.ws.close()
      this.ws = null
    }
  }
}

export const webSocketService = new WebSocketService()
