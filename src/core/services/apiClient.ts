import { useServiceStore } from '@/core/stores/service'

// 定义自定义接口
interface ApiHeaders {
  'Content-Type'?: string
  Authorization?: string
  [key: string]: string | undefined
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const serviceStore = useServiceStore()
  // [修改 1/1]：同时获取 environment
  const { endpointUrl, authKey, environment } = serviceStore

  if (!endpointUrl) {
    throw new Error('Service endpoint URL is not configured.')
  }

  const headers: ApiHeaders = {
    // 使用自定义接口类型
    'Content-Type': 'application/json',
    ...(options.headers as ApiHeaders), // 需要类型断言展开的 headers
  }

  // 只有在公网环境下才添加鉴权头
  if (environment === 'public') {
    headers.Authorization = `Bearer ${authKey}` // 使用点号访问而不是方括号
  }

  const response = await fetch(`${endpointUrl}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit, // 添加类型转换
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}
