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

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}
