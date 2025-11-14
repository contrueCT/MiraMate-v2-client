import { isCapacitor, isElectron } from '@/platform/env'
import type { Message } from '@/core/types'

const MESSAGE_STORAGE_KEY = 'mira-messages'

export interface MessageStorage {
  /**
   * 获取存储的消息列表
   * @param page 页码（从0开始）
   * @param pageSize 每页大小
   * @returns 消息列表（从旧到新的顺序）
   */
  getMessages: (page: number, pageSize: number) => Promise<Message[]>

  /**
   * 保存消息到存储
   * @param messages 完整的消息列表
   */
  saveMessages: (messages: Message[]) => Promise<{ success: boolean; error?: string }>

  /**
   * 获取总消息数
   */
  getMessageCount: () => Promise<number>

  /**
   * 清空所有消息
   */
  clearMessages: () => Promise<{ success: boolean; error?: string }>
}

/**
 * 消息存储实现
 * 支持 Electron、Capacitor 和 Web 环境
 */
export const messageStorage: MessageStorage = (() => {
  // Electron 环境：使用 Electron API
  if (isElectron) {
    const electronAPI = (window as any).electronAPI
    console.log('[MessageStorage] Electron environment detected')
    console.log('[MessageStorage] electronAPI available:', !!electronAPI)

    if (!electronAPI) {
      console.error('[MessageStorage] electronAPI not found! This should not happen.')
    }

    // 直接使用 Electron API，不做额外检查
    if (electronAPI) {
      console.log('[MessageStorage] Using Electron API for message storage')
      return {
        getMessages: async (page, pageSize) => {
          try {
            const result = await electronAPI.getMessages(page, pageSize)
            return result || []
          } catch {
            return []
          }
        },
        saveMessages: async (messages) => {
          try {
            // 将响应式对象转换为纯 JavaScript 对象，避免结构化克隆错误
            const plainMessages = JSON.parse(JSON.stringify(messages))
            await electronAPI.saveMessages(plainMessages)
            return { success: true }
          } catch (e: any) {
            return { success: false, error: String(e?.message || e) }
          }
        },
        getMessageCount: async () => {
          try {
            return (await electronAPI.getMessageCount()) || 0
          } catch {
            return 0
          }
        },
        clearMessages: async () => {
          try {
            await electronAPI.clearMessages()
            return { success: true }
          } catch (e: any) {
            return { success: false, error: String(e?.message || e) }
          }
        },
      }
    } else {
      console.log('[MessageStorage] Electron API incomplete, falling back to localStorage')
    }
  } else {
    console.log('[MessageStorage] Not Electron environment, using localStorage/Capacitor')
  }

  // Capacitor 或 Web 环境：使用 Preferences 或 localStorage
  const storageImpl = {
    async get(): Promise<Message[]> {
      try {
        let value: string | null = null
        if (isCapacitor) {
          try {
            const { Preferences } = await import('@capacitor/preferences')
            const result = await Preferences.get({ key: MESSAGE_STORAGE_KEY })
            value = result.value
          } catch {
            value = localStorage.getItem(MESSAGE_STORAGE_KEY)
          }
        } else {
          value = localStorage.getItem(MESSAGE_STORAGE_KEY)
        }

        if (!value) return []
        const messages = JSON.parse(value) as Message[]
        return Array.isArray(messages) ? messages : []
      } catch {
        return []
      }
    },

    async set(messages: Message[]): Promise<{ success: boolean; error?: string }> {
      try {
        const value = JSON.stringify(messages)
        if (isCapacitor) {
          try {
            const { Preferences } = await import('@capacitor/preferences')
            await Preferences.set({ key: MESSAGE_STORAGE_KEY, value })
            return { success: true }
          } catch {
            localStorage.setItem(MESSAGE_STORAGE_KEY, value)
            return { success: true }
          }
        } else {
          localStorage.setItem(MESSAGE_STORAGE_KEY, value)
          return { success: true }
        }
      } catch (e: any) {
        return { success: false, error: String(e?.message || e) }
      }
    },
  }

  return {
    getMessages: async (page, pageSize) => {
      try {
        const allMessages = await storageImpl.get()
        // 消息按时间从旧到新排序（确保顺序一致）
        allMessages.sort((a, b) => a.timestamp - b.timestamp)

        // 从最新的消息开始分页
        // page=0 返回最新的 pageSize 条消息
        // page=1 返回次新的 pageSize 条消息，依此类推
        const totalCount = allMessages.length
        const startIndex = Math.max(0, totalCount - (page + 1) * pageSize)
        const endIndex = totalCount - page * pageSize

        // 返回的消息保持从旧到新的顺序
        return allMessages.slice(startIndex, endIndex)
      } catch {
        return []
      }
    },

    saveMessages: async (messages) => {
      return storageImpl.set(messages)
    },

    getMessageCount: async () => {
      try {
        const allMessages = await storageImpl.get()
        return allMessages.length
      } catch {
        return 0
      }
    },

    clearMessages: async () => {
      try {
        if (isCapacitor) {
          try {
            const { Preferences } = await import('@capacitor/preferences')
            await Preferences.set({ key: MESSAGE_STORAGE_KEY, value: '[]' })
            return { success: true }
          } catch {
            localStorage.removeItem(MESSAGE_STORAGE_KEY)
            return { success: true }
          }
        } else {
          localStorage.removeItem(MESSAGE_STORAGE_KEY)
          return { success: true }
        }
      } catch (e: any) {
        return { success: false, error: String(e?.message || e) }
      }
    },
  }
})()
