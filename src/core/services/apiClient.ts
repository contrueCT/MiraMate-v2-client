import { useServiceStore } from '@/core/stores/service'

interface ApiHeaders {
  'Content-Type'?: string
  Authorization?: string
  [key: string]: string | undefined
}

type ExtendedRequestInit = RequestInit & { __skipAuth?: boolean }

export async function apiClient(endpoint: string, options: ExtendedRequestInit = {}) {
  const serviceStore = useServiceStore()
  const { endpointUrl, authKey, environment } = serviceStore

  if (!endpointUrl) {
    throw new Error('Service endpoint URL is not configured.')
  }

  const headers: ApiHeaders = {
    ...(options.headers as ApiHeaders),
  }

  // 仅当存在 body 且未显式指定时设置 JSON Content-Type，避免无谓的 CORS 预检
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // 只有在公网环境下才添加鉴权头
  if (environment === 'public' && !options.__skipAuth) {
    headers.Authorization = `Bearer ${authKey}`
  }

  const response = await fetch(`${endpointUrl}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
  })

  // 开发期调试日志：打印请求与响应状态
  if (import.meta && (import.meta as any).env && (import.meta as any).env.DEV) {
    try {
      // 仅在开发态打印，避免泄露生产日志
      console.log('[apiClient]', {
        url: `${endpointUrl}${endpoint}`,
        method: options.method || 'GET',
        status: response.status,
      })
    } catch (_) {
      // 忽略控制台异常
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}
