'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Wifi, WifiOff, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Loader2, Zap, Save } from 'lucide-react'
import { getApiConfig, saveApiConfig, type ApiConfig } from '@/lib/api-store'

type ApiType = 'ai_studio' | 'vertex'
type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

const AI_STUDIO_MODELS = [
  { id: 'gemini-3.1-flash-image', label: 'Nano Banana 2 · 3.1 Flash ⭐', tier: 'FREE' },
  { id: 'gemini-3-pro-image',     label: 'Nano Banana Pro · 3 Pro',      tier: 'FREE' },
  { id: 'gemini-2.5-flash-image', label: 'Nano Banana · 2.5 Flash',      tier: 'FREE' },
]
const VERTEX_MODELS = [
  { id: 'imagen-3.0-generate-002',      label: 'Imagen 3.0',         tier: '$0.040/img' },
  { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast',    tier: '$0.020/img' },
  { id: 'imagegeneration@006',          label: 'Imagen 2 (legacy)',  tier: '$0.020/img' },
]

function detectApiType(key: string): ApiType | null {
  if (key.startsWith('AIza')) return 'ai_studio'
  // AQ. and other Google AI Studio key formats
  if (key.startsWith('AQ.')) return 'ai_studio'
  return null  // unknown — don't override user's selection
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false)
  const detected = value.trim().length > 0 ? detectApiType(value) : null
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none border pr-20"
        style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {detected !== null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
            background: 'rgba(16,185,129,0.15)',
            color: '#34d399'
          }}>
            AI Studio
          </span>
        )}
        <button type="button" onClick={() => setVisible(v => !v)}>
          {visible ? <EyeOff size={14} style={{ color: '#71717a' }} /> : <Eye size={14} style={{ color: '#71717a' }} />}
        </button>
      </div>
    </div>
  )
}

function GeminiCard() {
  const [open, setOpen] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [apiType, setApiType] = useState<ApiType>('ai_studio')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')
  const [latency, setLatency] = useState<number | null>(null)
  const [projectId, setProjectId] = useState('')
  const [region, setRegion] = useState('us-central1')
  const [model, setModel] = useState(AI_STUDIO_MODELS[0].id)
  const [imageLimit, setImageLimit] = useState('500')
  const [budget, setBudget] = useState('50')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [saved, setSaved] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const cfg = getApiConfig()
    if (cfg.apiKey) {
      setApiKey(cfg.apiKey)
      setApiType(cfg.type)
      setModel(cfg.model)
      setImageLimit(String(cfg.imageLimit))
      setBudget(String(cfg.budget))
      if (cfg.projectId) setProjectId(cfg.projectId)
      if (cfg.region) setRegion(cfg.region)
      if (cfg.customEndpoint) setCustomEndpoint(cfg.customEndpoint)
      if (cfg.testStatus === 'ok') { setTestStatus('ok'); setLatency(cfg.latency ?? null) }
      else if (cfg.testStatus === 'error') setTestStatus('error')
    }
  }, [])

  const resolvedType: ApiType = apiType
  const models = resolvedType === 'vertex' ? VERTEX_MODELS : AI_STUDIO_MODELS

  const persist = useCallback((patch: Partial<ApiConfig>) => {
    saveApiConfig(patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleKeyChange = (v: string) => {
    setApiKey(v)
    const detected = detectApiType(v)
    // Only auto-switch type when detection is unambiguous (AIza / AQ. = AI Studio)
    if (detected !== null) {
      setApiType(detected)
      persist({ apiKey: v, type: detected, testStatus: 'untested' })
    } else {
      persist({ apiKey: v, testStatus: 'untested' })
    }
    setTestStatus('idle')
  }

  const handleSave = () => {
    persist({
      apiKey, type: resolvedType, model,
      projectId, region, customEndpoint,
      imageLimit: parseInt(imageLimit, 10) || 500,
      budget: parseFloat(budget) || 50,
    })
  }

  const runTest = async () => {
    if (!apiKey.trim()) {
      setTestError('Introduce una API key primero.')
      setTestStatus('error')
      saveApiConfig({ testStatus: 'error' })
      return
    }
    setTestStatus('testing')
    setTestError('')
    try {
      const r = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiType: resolvedType, projectId, region, customEndpoint }),
      })
      const d = await r.json()
      if (d.ok) {
        setTestStatus('ok')
        setLatency(d.latency)
        saveApiConfig({ apiKey, type: resolvedType, model, projectId, region, customEndpoint, testStatus: 'ok', latency: d.latency, lastTested: new Date().toISOString() })
      } else {
        setTestStatus('error')
        setTestError(d.error || 'Error desconocido')
        saveApiConfig({ testStatus: 'error' })
      }
    } catch (e: unknown) {
      setTestStatus('error')
      setTestError(e instanceof Error ? e.message : 'Error de red')
      saveApiConfig({ testStatus: 'error' })
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: '#27272a' }}>🍌</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Nano Banana / Gemini</span>
              {testStatus === 'ok' && <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} title="Conectado" />}
              {testStatus === 'error' && <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} title="Error" />}
              {testStatus === 'idle' && apiKey && <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} title="Sin probar" />}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
              {testStatus === 'ok' ? `Conectado · ${latency}ms` : testStatus === 'error' ? 'Error de conexión' : 'Generación de imágenes — Google AI'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Guardado</span>}
          {open ? <ChevronDown size={16} style={{ color: '#71717a' }} /> : <ChevronRight size={16} style={{ color: '#71717a' }} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: '#27272a' }}>
          {/* API type */}
          <div className="pt-4">
            <label className="text-xs mb-2 block" style={{ color: '#71717a' }}>Tipo de API</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'ai_studio' as ApiType, label: 'Google AI Studio', sub: 'Plan gratuito · clave AIza / AQ.', color: '#10b981' },
                { id: 'vertex' as ApiType, label: 'Vertex AI', sub: 'GCP · facturación por uso', color: '#818cf8' },
              ]).map(opt => (
                <button key={opt.id} onClick={() => {
                  setApiType(opt.id)
                  const firstModel = opt.id === 'vertex' ? VERTEX_MODELS[0].id : AI_STUDIO_MODELS[0].id
                  setModel(firstModel)
                  persist({ type: opt.id, model: firstModel })
                }}
                  className="text-left p-3 rounded-lg border transition-colors"
                  style={{
                    borderColor: resolvedType === opt.id ? opt.color : '#27272a',
                    background: resolvedType === opt.id ? `${opt.color}12` : '#09090b'
                  }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: resolvedType === opt.id ? opt.color : '#52525b' }} />
                    <span className="text-xs font-medium" style={{ color: resolvedType === opt.id ? '#f4f4f5' : '#71717a' }}>{opt.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: '#52525b' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
            {apiKey.trim().length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Zap size={11} style={{ color: '#fbbf24' }} />
                <span className="text-[10px]" style={{ color: '#fbbf24' }}>Tipo detectado por el formato de la clave</span>
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>API Key</label>
            <MaskedInput
              value={apiKey}
              onChange={handleKeyChange}
              placeholder={resolvedType === 'ai_studio' ? 'AIza...' : 'Service account key o API key'}
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Modelo por defecto</label>
            <div className="relative">
              <select value={model} onChange={e => { setModel(e.target.value); persist({ model: e.target.value }) }}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm outline-none border pr-8"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.label} [{m.tier}]</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
            </div>
          </div>

          {/* Vertex-only */}
          {resolvedType === 'vertex' && (
            <>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Google Cloud Project ID</label>
                <input value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                  placeholder="my-gcp-project-id" />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Región</label>
                <input value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                  placeholder="us-central1" />
              </div>
            </>
          )}

          {/* Custom endpoint — only relevant for Vertex AI */}
          {resolvedType === 'vertex' && (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>
                Endpoint personalizado <span style={{ color: '#52525b' }}>(opcional)</span>
              </label>
              <input value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                placeholder="https://us-central1-aiplatform.googleapis.com" />
            </div>
          )}

          {/* Limit field */}
          {resolvedType === 'ai_studio' ? (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>
                Límite diario
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>Plan gratuito</span>
              </label>
              <div className="flex gap-2 items-center">
                <input type="number" value={imageLimit} onChange={e => setImageLimit(e.target.value)}
                  className="w-28 rounded-lg px-3 py-2 text-sm outline-none border font-mono"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
                <span className="text-xs" style={{ color: '#71717a' }}>imágenes/día</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle size={12} style={{ color: '#fbbf24' }} />
                <span className="text-xs" style={{ color: '#fbbf24' }}>Alerta al 80% del límite diario</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Presupuesto mensual límite</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#71717a' }}>$</span>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 pl-7 text-sm outline-none border"
                    style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
                </div>
                <select className="rounded-lg px-3 py-2 text-sm outline-none border"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}>
                  <option>USD</option><option>EUR</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle size={12} style={{ color: '#fbbf24' }} />
                <span className="text-xs" style={{ color: '#fbbf24' }}>Alerta al 80% · corte al 100%</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#27272a' }}>
            <div className="flex items-center gap-2">
              {testStatus === 'ok' && (
                <><CheckCircle size={14} style={{ color: '#10b981' }} /><span className="text-xs" style={{ color: '#10b981' }}>Conectado — {latency}ms</span></>
              )}
              {testStatus === 'error' && (
                <><WifiOff size={14} style={{ color: '#ef4444' }} /><span className="text-xs max-w-[200px] truncate" style={{ color: '#ef4444' }}>{testError || 'Error de conexión'}</span></>
              )}
              {testStatus === 'testing' && (
                <><Loader2 size={14} className="animate-spin" style={{ color: '#fbbf24' }} /><span className="text-xs" style={{ color: '#fbbf24' }}>Probando...</span></>
              )}
              {testStatus === 'idle' && <span className="text-xs" style={{ color: '#52525b' }}>Sin probar</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: '#27272a', color: '#f4f4f5', background: '#09090b' }}>
                <Save size={11} />Guardar
              </button>
              <button onClick={runTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: '#27272a', color: '#f4f4f5', background: '#09090b' }}>
                <Wifi size={12} />Test conexión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LockedCard({ name, icon, sub }: { name: string; icon: string; sub: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: '#27272a' }}>{icon}</div>
          <div>
            <div className="text-sm font-medium" style={{ color: '#f4f4f5' }}>{name}</div>
            <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>{sub}</div>
          </div>
        </div>
        {open ? <ChevronDown size={16} style={{ color: '#71717a' }} /> : <ChevronRight size={16} style={{ color: '#71717a' }} />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: '#27272a' }}>
          <div className="pt-4 flex items-center gap-3 px-4 py-4 rounded-lg" style={{ background: '#09090b' }}>
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-sm font-medium" style={{ color: '#71717a' }}>Disponible en la siguiente iteración</div>
              <div className="text-xs mt-0.5" style={{ color: '#52525b' }}>Se habilitará junto con su módulo correspondiente</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function APIsPage() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <p className="text-xs mb-1" style={{ color: '#71717a' }}>Configuración</p>
        <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Gestión de APIs</h1>
        <p className="text-xs mt-1" style={{ color: '#71717a' }}>
          La configuración se guarda automáticamente en el navegador. Clave <span className="font-mono" style={{ color: '#34d399' }}>AIza...</span> = Google AI Studio · otro formato = Vertex AI
        </p>
      </div>
      <GeminiCard />
      <LockedCard name="ElevenLabs" icon="🎙️" sub="Síntesis de voz — próximamente" />
      <LockedCard name="Claude / Anthropic" icon="🤖" sub="Generación de scripts — próximamente" />
    </div>
  )
}
