'use client'

import { useState } from 'react'
import { Eye, EyeOff, Wifi, WifiOff, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

interface ApiCardProps {
  name: string; description: string; icon: string; children: React.ReactNode; defaultOpen?: boolean
}

function ApiCard({ name, description, icon, children, defaultOpen = false }: ApiCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ background: '#18181b' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: '#27272a' }}>{icon}</div>
          <div>
            <div className="text-sm font-medium" style={{ color: '#f4f4f5' }}>{name}</div>
            <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>{description}</div>
          </div>
        </div>
        {open ? <ChevronDown size={16} style={{ color: '#71717a' }} /> : <ChevronRight size={16} style={{ color: '#71717a' }} />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: '#27272a' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ placeholder, defaultValue, type = 'text' }: { placeholder?: string; defaultValue?: string; type?: string }) {
  return (
    <input type={type} defaultValue={defaultValue} placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
      style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
  )
}

function MaskedField({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <FieldRow label={label}>
      <div className="relative">
        <input type={visible ? 'text' : 'password'}
          defaultValue="sk-••••••••••••••••••••••••••••••••"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none border pr-10"
          style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
        <button onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
          {visible ? <EyeOff size={14} style={{ color: '#71717a' }} /> : <Eye size={14} style={{ color: '#71717a' }} />}
        </button>
      </div>
    </FieldRow>
  )
}

function TestButton({ status, onTest }: { status: 'idle' | 'testing' | 'ok' | 'error'; onTest: () => void }) {
  return (
    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#27272a' }}>
      <div className="flex items-center gap-2">
        {status === 'ok' && <><CheckCircle size={14} style={{ color: '#10b981' }} /><span className="text-xs" style={{ color: '#10b981' }}>Conectado — 142ms</span></>}
        {status === 'error' && <><WifiOff size={14} style={{ color: '#ef4444' }} /><span className="text-xs" style={{ color: '#ef4444' }}>Error — timeout</span></>}
        {status === 'testing' && <><Loader2 size={14} className="animate-spin" style={{ color: '#fbbf24' }} /><span className="text-xs" style={{ color: '#fbbf24' }}>Probando...</span></>}
        {status === 'idle' && <span className="text-xs" style={{ color: '#52525b' }}>No probado</span>}
      </div>
      <button onClick={onTest}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{ borderColor: '#27272a', color: '#f4f4f5', background: '#09090b' }}>
        <Wifi size={12} />Test conexión
      </button>
    </div>
  )
}

function BudgetField() {
  return (
    <FieldRow label="Presupuesto mensual límite">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#71717a' }}>$</span>
          <input type="number" defaultValue="50"
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
        <span className="text-xs" style={{ color: '#fbbf24' }}>Alerta visual al 80% y corte al 100%</span>
      </div>
    </FieldRow>
  )
}

export default function APIsPage() {
  const [nbStatus, setNbStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('ok')

  const test = (setter: typeof setNbStatus) => {
    setter('testing')
    setTimeout(() => setter(Math.random() > 0.2 ? 'ok' : 'error'), 1800)
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <p className="text-xs mb-1" style={{ color: '#71717a' }}>Configuración</p>
        <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Gestión de APIs</h1>
      </div>

      <ApiCard name="Nano Banana / Gemini" description="Generación de imágenes via Vertex AI" icon="🍌" defaultOpen>
        <div className="space-y-4 pt-4">
          <MaskedField label="API Key" />
          <FieldRow label="Google Cloud Project ID">
            <Input placeholder="my-gcp-project-id" />
          </FieldRow>
          <FieldRow label="Modelo por defecto">
            <div className="relative">
              <select className="w-full appearance-none rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}>
                <option>gemini-2.5-flash-image</option>
                <option>gemini-3.1-flash-image-preview</option>
                <option>gemini-3-pro-image-preview</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
            </div>
          </FieldRow>
          <FieldRow label="Región / Endpoint (Vertex AI)">
            <Input placeholder="us-central1" defaultValue="us-central1" />
          </FieldRow>
          <BudgetField />
          <TestButton status={geminiStatus} onTest={() => test(setGeminiStatus)} />
        </div>
      </ApiCard>

      <ApiCard name="ElevenLabs" description="Síntesis de voz — próximamente" icon="🎙️">
        <div className="pt-4 flex items-center gap-3 py-4 px-4 rounded-lg" style={{ background: '#09090b' }}>
          <span className="text-2xl">🔒</span>
          <div>
            <div className="text-sm font-medium" style={{ color: '#71717a' }}>Disponible en la siguiente iteración</div>
            <div className="text-xs mt-0.5" style={{ color: '#52525b' }}>Se habilitará junto con el módulo de voces</div>
          </div>
        </div>
      </ApiCard>

      <ApiCard name="Claude / Anthropic" description="Generación de scripts — próximamente" icon="🤖">
        <div className="pt-4 flex items-center gap-3 py-4 px-4 rounded-lg" style={{ background: '#09090b' }}>
          <span className="text-2xl">🔒</span>
          <div>
            <div className="text-sm font-medium" style={{ color: '#71717a' }}>Disponible en la siguiente iteración</div>
            <div className="text-xs mt-0.5" style={{ color: '#52525b' }}>Se habilitará junto con el módulo de scripts</div>
          </div>
        </div>
      </ApiCard>
    </div>
  )
}
