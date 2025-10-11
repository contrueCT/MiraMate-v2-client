import { useServiceStore } from '@/core/stores/service'

/**
 * 创建带鉴权的 WebSocket 连接（简单方案：query 参数携带 token）。
 * - 仅在公网环境（environment === 'public'）下添加 token。
 * - 自动将 http(s) 的 endpointUrl 转换为 ws(s)。
 * - path 形如 '/ws' 或 '/ws/stream'。
 */
export function createAuthedWebSocket(path: string): WebSocket {
  const serviceStore = useServiceStore()
  const { endpointUrl, authKey, environment } = serviceStore

  if (!endpointUrl) {
    throw new Error('Service endpoint URL is not configured.')
  }

  // 将 http:// 或 https:// 替换为 ws:// 或 wss://
  const wsBase = endpointUrl.replace(/^http/i, 'ws')
  const url = new URL(path, wsBase)

  // 公网环境下携带 token
  if (environment === 'public' && authKey) {
    url.searchParams.set('token', authKey)
  }

  return new WebSocket(url.toString())
}
