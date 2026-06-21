export type ApiConfig = {
  type: 'ai_studio' | 'vertex'
  apiKey: string
  model: string
  projectId?: string
  region?: string
  customEndpoint?: string
  imageLimit: number
  budget: number
  testStatus: 'ok' | 'error' | 'untested'
  latency?: number
  lastTested?: string
}

const KEY = 'ytf_crm_api_config'

const DEFAULTS: ApiConfig = {
  type: 'ai_studio',
  apiKey: '',
  model: 'gemini-3.1-flash-image',
  imageLimit: 500,
  budget: 50,
  testStatus: 'untested',
}

export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const s = localStorage.getItem(KEY)
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS
  } catch { return DEFAULTS }
}

export function saveApiConfig(cfg: Partial<ApiConfig>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify({ ...getApiConfig(), ...cfg }))
}

export function isApiReady(): boolean {
  const cfg = getApiConfig()
  return cfg.apiKey.trim().length > 0 && cfg.testStatus === 'ok'
}

export function isApiConfigured(): boolean {
  return getApiConfig().apiKey.trim().length > 0
}
