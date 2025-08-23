// src/core/types.ts

/**
 * AI 的实时状态
 * - idle: 空闲，在线
 * - thinking: 正在思考（请求已发送，等待第一个数据块）
 * - typing: 正在输入（正在接收流式数据）
 */
export type AIStatus = 'idle' | 'thinking' | 'typing' | 'processing'

/**
 * 单条消息的结构
 */
export interface Message {
  id: string // 使用唯一ID，如时间戳或uuid
  sender: 'ai' | 'user'
  text: string
  timestamp: number
  isStreaming?: boolean // 标志此消息是否正在流式传输中
}

/**
 * 模型配置的结构
 */
export interface ModelConfig {
  type: 'OpenAI 兼容接口' | 'Google Gemini'
  baseUrl: string
  apiKey: string
  modelName: string
}

/**
 * 后端API定义的单个LLM配置结构
 */
export interface LLMConfig {
  model: string
  api_key: string
  base_url?: string // 对于gemini可能没有
  api_type: 'openai' | 'gemini'
  model_kwargs?: Record<string, any> // 灵活的键值对
}

/**
 * 前端UI使用的扁平化模型配置结构
 */
export interface UIModelConfig {
  type: 'OpenAI 兼容接口' | 'Google Gemini'
  baseUrl: string
  apiKey: string
  modelName: string
  // 用于缓存从后端来的原始model_kwargs
  _originalKwargs?: Record<string, any>
}
