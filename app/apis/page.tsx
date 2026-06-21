'use client'

import { useState } from 'react'
import { Eye, EyeOff, Wifi, WifiOff, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react'

type ApiType = 'ai_studio' | 'vertex'
type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

function detectApiType(key: string): ApiType {
  return key.startsWith('AIza') ? 'ai_studio' : 'vertex'
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false)
  const detected = value.trim().length > 0 ? detectApiType(value) : null
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none border pr-20"
        style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {detected && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
            background: detected === 'ai_studio' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            color: detected === 'ai_studio' ? '#34d399' : '#818cf8'
          }}>
            {detected === 'ai_studio' ? 'AI Studio' : 'Vertex'}
          </span>
        )}
        <button type="button" onClick={() => setVisible(v => !v)}>
          {visible ? <EyeOff size={14} style={{ color: '#71717a' }} /> : <Eye size={14} style={{ color: '#71717a' }} />}
        </button>
      </div>
    </div>
  )
}

function Input({ value, onChange, placeholder, defaultValue }: { value?: string; onChange?: (v: string) => void; placeholder?: string; defaultValue?: string }) {
  return (
    <input
      type="text"
      value={value}
      defaultValue={defaultValue}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
      style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
    />
  )
}

function TestButton({ status, onTest }: { status: TestStatus; onTest: () => void }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t mt-3" style={{ borderColor: '#27272a' }}>
      <div className="flex items-center gap-2">
        {status === 'ok' && <><CheckCircle size={14} style={{ color: '#10b981' }} /><span className="text-xs" style={{ color: '#10b981' }}>Conectado — 142ms</span></>}
        {status === 'error' && <><WifiOff size={14} style={{ color: '#ef4444' }} /><span className="text-xs" style={{ color: '#ef4444' }}>Error de conexión</span></>}
        {status === 'testing' && <><Loader2 size={14} className="animate-spin" style={{ color: '#fbbf24' }} /><span className="text-xs" style={{ color: '#fbbf24' }}>Probando...</span></>}
        {status === 'idle' && <span className="text-xs" style={{ color: '#52525b' }}>No probado aún</span>}
      </div>
      <button onClick={onTest}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{ borderColor: '#27272a', color: '#f4f4f5', background: '#09090b' }}>
        <Wifi size={12} />Test conexión
      </button>
    </div>
  )
}

function GeminiCard() {
  const [open, setOpen] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [apiType, setApiType] = useState<ApiType>('ai_studio')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [projectId, setProjectId] = useState('')
  const [region, setRegion] = useState('us-central1')
  const [imageLimit, setImageLimit] = useState('500')
  const [budget, setBudget] = useState('50')

  const resolvedType: ApiType = apiKey.trim() ? detectApiType(apiKey) : apiType

  const runTest = () => {
    setTestStatus('testing')
    setTimeout(() => setTestStatus(Math.random() > 0.15 ? 'ok' : 'error'), 1800)
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
              {testStatus === 'ok' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />}
              {testStatus === 'error' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>Generación de imágenes — Google AI</div>
          </div>
        </div>
        {open ? <ChevronDown size={16} style={{ color: '#71717a' }} /> : <ChevronRight size={16} style={{ color: '#71717a' }} />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: '#27272a' }}>
          {/* API type selector */}
          <div className="pt-4">
            <label className="text-xs mb-2 block" style={{ color: '#71717a' }}>Tipo de API</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'ai_studio' as ApiType, label: 'Google AI Studio', sub: 'Plan gratuito · clave AIza...', color: '#10b981' },
                { id: 'vertex' as ApiType, label: 'Vertex AI', sub: 'GCP · facturación por uso', color: '#818cf8' },
              ]).map(opt => (
                <button key={opt.id} onClick={() => setApiType(opt.id)}
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
                <span className="text-[10px]" style={{ color: '#fbbf24' }}>
                  Tipo detectado automáticamente por el formato de la clave
                </span>
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>API Key</label>
            <MaskedInput
              value={apiKey}
              onChange={v => { setApiKey(v); if (v.trim()) setApiType(detectApiType(v)) }}
              placeholder={resolvedType === 'ai_studio' ? 'AIza...' : 'Service account key o API key'}
            />
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Modelo por defecto</label>
            <div className="relative">
              <select className="w-full appearance-none rounded-lg px-3 py-2 text-sm outline-none border pr-8"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}>
                <option>gemini-2.0-flash-exp-image-generation</option>
                <option>gemini-2.5-flash-preview-05-20</option>
                <option>imagen-3.0-generate-002</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
            </div>
          </div>

          {/* Vertex-only fields */}
          {resolvedType === 'vertex' && (
            <>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Google Cloud Project ID</label>
                <Input value={projectId} onChange={setProjectId} placeholder="my-gcp-project-id" />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Región / Endpoint</label>
                <Input value={region} onChange={setRegion} placeholder="us-central1" />
              </div>
            </>
          )}

          {/* Limit field — different per type */}
          {resolvedType === 'ai_studio' ? (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>
                Límite de imágenes diario
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                  Plan gratuito
                </span>
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

          <TestButton status={testStatus} onTest={runTest} />
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
          <div className="pt-4 flex items-center gap-3 py-4 px-4 rounded-lg" style={{ background: '#09090b' }}>
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
          La clave se detecta automáticamente: <span className="font-mono" style={{ color: '#34d399' }}>AIza...</span> = Google AI Studio &nbsp;·&nbsp; otro formato = Vertex AI
        </p>
      </div>
      <GeminiCard />
      <LockedCard name="ElevenLabs" icon="🎙️" sub="Síntesis de voz — próximamente" />
      <LockedCard name="Claude / Anthropic" icon="🤖" sub="Generación de scripts — próximamente" />
    </div>
  )
}
