import { useServiceStore } from '@/core/stores/service'

interface ApiHeaders {
  'Content-Type'?: string
  Authorization?: string
  [key: string]: string | undefined
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const serviceStore = useServiceStore()
  const { endpointUrl, authKey, environment } = serviceStore

  if (!endpointUrl) {
    throw new Error('Service endpoint URL is not configured.')
  }

  const headers: ApiHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers as ApiHeaders),
  }

  // 只有在公网环境下才添加鉴权头
  if (environment === 'public') {
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
