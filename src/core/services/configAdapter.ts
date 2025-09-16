import type { LLMConfig, UIModelConfig } from '@/core/types'

/**
 * 校验并净化从服务器获取的原始LLM配置数据。
 * @param rawData - 从API接收的未知类型数据。
 * @returns 一个保证类型安全且干净的 LLMConfig 数组。
 */
export function validateAndSanitizeLLMConfigs(rawData: any): LLMConfig[] {
  if (!Array.isArray(rawData)) {
    console.warn('Invalid LLM config format: data is not an array.', rawData)
    return [] // 返回空数组
  }

  const sanitizedConfigs: LLMConfig[] = []

  for (const item of rawData) {
    // 检查每个元素是否为对象
    if (typeof item !== 'object' || item === null) {
      console.warn('Skipping invalid item in LLM config: not an object.', item)
      continue
    }

    // 解构并检查必需字段的类型
    const { model, api_key, base_url, api_type, model_kwargs } = item

    // `api_type` 是最重要的，必须有效
    if (api_type !== 'openai' && api_type !== 'gemini') {
      console.warn("Skipping invalid item: 'api_type' is missing or invalid.", item)
      continue
    }

    // `model` 和 `api_key` 最好有，但即使为空字符串也允许预填
    if (typeof model !== 'string' || typeof api_key !== 'string') {
      console.warn("Skipping invalid item: 'model' or 'api_key' is not a string.", item)
      continue
    }

    // 重新构建对象
    const sanitizedConfig: LLMConfig = {
      api_type,
      model,
      api_key,
    }

    // 安全地处理可选字段
    if (typeof base_url === 'string') {
      sanitizedConfig.base_url = base_url
    }

    if (typeof model_kwargs === 'object' && model_kwargs !== null) {
      sanitizedConfig.model_kwargs = model_kwargs
    }

    sanitizedConfigs.push(sanitizedConfig)
  }

  // 限制最多只取两个模型配置
  return sanitizedConfigs.slice(0, 2)
}

const apiTypeMap: Record<LLMConfig['api_type'], UIModelConfig['type']> = {
  openai: 'OpenAI 兼容接口',
  gemini: 'Google Gemini',
}

const uiTypeMap: Record<UIModelConfig['type'], LLMConfig['api_type']> = {
  'OpenAI 兼容接口': 'openai',
  'Google Gemini': 'gemini',
}

/**
 * 将后端LLM配置数组转换为前端UI状态
 */
export function backendToFrontend(configs: LLMConfig[]): {
  primary: UIModelConfig
  secondary: UIModelConfig
} {
  const primaryBackend = configs[0] || {}
  const secondaryBackend = configs[1] || {}

  const convert = (config: Partial<LLMConfig>): UIModelConfig => ({
    type: config.api_type ? apiTypeMap[config.api_type] : 'OpenAI 兼容接口',
    baseUrl: config.base_url || '',
    apiKey: config.api_key || '',
    modelName: config.model || '',
    _originalKwargs: config.model_kwargs || {}, // 缓存kwargs
  })

  return {
    primary: convert(primaryBackend),
    secondary: convert(secondaryBackend),
  }
}

/**
 * 将前端UI状态转换为后端LLM配置数组
 */
export function frontendToBackend(draft: {
  primary: UIModelConfig
  secondary: UIModelConfig
}): LLMConfig[] {
  const convert = (config: UIModelConfig): LLMConfig => {
    const api_type = uiTypeMap[config.type]

    // 智能处理 model_kwargs
    const model_kwargs = { ...(config._originalKwargs || {}) }
    if (api_type === 'gemini') {
      model_kwargs.response_mime_type = 'application/json'
    } else {
      // 确保openai类型没有这个参数
      delete model_kwargs.response_mime_type
    }

    const backendConfig: LLMConfig = {
      api_type,
      model: config.modelName,
      api_key: config.apiKey,
      model_kwargs,
    }

    // 只有openai类型才需要base_url
    if (api_type === 'openai') {
      backendConfig.base_url = config.baseUrl
    }

    return backendConfig
  }

  const configs = []
  // 确保即使输入框为空，也生成一个结构基本正确的对象
  if (draft.primary.modelName || draft.primary.apiKey) {
    configs.push(convert(draft.primary))
  }
  if (draft.secondary.modelName || draft.secondary.apiKey) {
    configs.push(convert(draft.secondary))
  }

  return configs
}
