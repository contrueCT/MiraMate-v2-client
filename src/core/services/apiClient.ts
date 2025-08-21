import { useServiceStore } from '@/core/stores/service'

// 这是一个简单的封装，为第四阶段做准备
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const serviceStore = useServiceStore()
  const { endpointUrl, authKey } = serviceStore

  if (!endpointUrl) {
    throw new Error('Service endpoint URL is not configured.')
  }

  const headers = {
    Authorization: `Bearer ${authKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${endpointUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // 可以在这里做更复杂的全局错误处理
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}
