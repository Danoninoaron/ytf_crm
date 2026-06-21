'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, Plus, Trash2, Download, Eye, RefreshCw,
  ChevronDown, X, Loader2, CheckCircle, Clock, AlertCircle,
  ZoomIn, Upload, Archive, WifiOff, Settings
} from 'lucide-react'
import { addImages, saveQueueStats, type GeneratedImage } from '@/lib/content-store'
import { getApiConfig, type ApiConfig } from '@/lib/api-store'

type JobStatus = 'waiting' | 'processing' | 'completed' | 'error'
interface Job {
  id: string; prompt: string; status: JobStatus; model: string
  aspectRatio: string; resolution: string; duration?: number
  imageUrl?: string; errorMsg?: string
}

const AI_STUDIO_MODELS = [
  { id: 'gemini-2.0-flash-preview-image-generation', label: 'NB 2.0 Flash Preview', price: 'FREE' },
  { id: 'gemini-2.0-flash-exp-image-generation',     label: 'NB 2.0 Flash EXP',     price: 'FREE' },
]

const VERTEX_MODELS = [
  { id: 'imagen-3.0-generate-002',      label: 'Imagen 3.0',       price: '$0.040' },
  { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast',  price: '$0.020' },
  { id: 'imagegeneration@006',          label: 'Imagen 2 (legacy)', price: '$0.020' },
]

const RATIO_SHAPES: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 22, h: 22 }, '16:9': { w: 30, h: 17 }, '9:16': { w: 17, h: 30 },
  '4:3':  { w: 26, h: 19 }, '3:4':  { w: 19, h: 26 }, '2:3':  { w: 18, h: 26 },
  '3:2':  { w: 26, h: 18 }, '4:5':  { w: 20, h: 25 }, '5:4':  { w: 25, h: 20 },
  '21:9': { w: 30, h: 13 },
}

const RATIO_DIMS: Record<string, { w: number; h: number }> = {
  '1:1': { w: 600, h: 600 }, '16:9': { w: 800, h: 450 }, '9:16': { w: 450, h: 800 },
  '4:3': { w: 800, h: 600 }, '3:4':  { w: 600, h: 800 }, '2:3':  { w: 533, h: 800 },
  '3:2': { w: 800, h: 533 }, '4:5':  { w: 640, h: 800 }, '5:4':  { w: 800, h: 640 },
  '21:9':{ w: 840, h: 360 },
}

const RESOLUTIONS = ['512', '1K', '2K', '4K']

const STATUS_ICONS = {
  waiting:    <Clock size={13} style={{ color: '#71717a' }} />,
  processing: <Loader2 size={13} className="animate-spin" style={{ color: '#fbbf24' }} />,
  completed:  <CheckCircle size={13} style={{ color: '#10b981' }} />,
  error:      <AlertCircle size={13} style={{ color: '#ef4444' }} />,
}
const STATUS_LABELS: Record<JobStatus, string> = {
  waiting: 'En espera', processing: 'Procesando', completed: 'Completado', error: 'Error'
}

function AspectBtn({ ratio, selected, onClick }: { ratio: string; selected: boolean; onClick: () => void }) {
  const s = RATIO_SHAPES[ratio]
  const maxDim = 28
  const scale = maxDim / Math.max(s.w, s.h)
  const w = Math.round(s.w * scale)
  const h = Math.round(s.h * scale)
  return (
    <button onClick={onClick} title={ratio}
      className="flex flex-col items-center justify-center gap-1 rounded-lg border transition-colors"
      style={{ width: 48, height: 56, padding: 4, flexShrink: 0,
        background: selected ? 'rgba(16,185,129,0.15)' : '#09090b',
        borderColor: selected ? '#10b981' : '#27272a' }}>
      <div style={{ width: w, height: h, flexShrink: 0,
        border: `1.5px solid ${selected ? '#10b981' : '#52525b'}`,
        borderRadius: 2,
        background: selected ? 'rgba(16,185,129,0.2)' : 'transparent' }} />
      <span style={{ fontSize: 8, color: selected ? '#34d399' : '#71717a', fontFamily: 'monospace', lineHeight: 1 }}>{ratio}</span>
    </button>
  )
}

function NoApiBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-4"
      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}>
      <WifiOff size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
      <div>
        <p className="text-sm font-medium" style={{ color: '#ef4444' }}>No hay API configurada</p>
        <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
          Ve a <a href="/apis" className="underline" style={{ color: '#f87171' }}>Gestión de APIs</a> y configura tu clave de Nano Banana / Gemini antes de generar imágenes.
        </p>
      </div>
    </div>
  )
}

function UntestedBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-4"
      style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.25)' }}>
      <Settings size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
      <div>
        <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>API configurada pero sin probar</p>
        <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
          Puedes generar, pero te recomendamos hacer el <a href="/apis" className="underline" style={{ color: '#fde68a' }}>test de conexión</a> primero para confirmar que la clave es válida.
        </p>
      </div>
    </div>
  )
}

export default function ProduccionImagenesPage() {
  const [promptsText, setPromptsText] = useState('')
  const [queue, setQueue] = useState<Job[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AI_STUDIO_MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('1K')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [concurrency, setConcurrency] = useState(1)
  const [preview, setPreview] = useState<string | null>(null)
  const [refImages, setRefImages] = useState<{ url: string; name: string }[]>([])
  const [isZipping, setIsZipping] = useState(false)
  const [apiCfg, setApiCfg] = useState<ApiConfig | null>(null)
  const runningRef = useRef(false)
  const batchIdRef = useRef(`batch_${Date.now()}`)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const models = apiCfg?.type === 'vertex' ? VERTEX_MODELS : AI_STUDIO_MODELS
  const modelInfo = models.find(m => m.id === selectedModel) ?? models[0]

  // Load API config and queue from storage on mount
  useEffect(() => {
    const cfg = getApiConfig()
    if (cfg.apiKey) {
      setApiCfg(cfg)
      setSelectedModel(cfg.model || AI_STUDIO_MODELS[0].id)
    }
    const saved = sessionStorage.getItem('ytf_queue')
    if (saved) { try { setQueue(JSON.parse(saved)) } catch { /* ignore */ } }
  }, [])

  // Sync API config periodically (user may have changed it in APIs page)
  useEffect(() => {
    const id = setInterval(() => {
      const cfg = getApiConfig()
      setApiCfg(cfg.apiKey ? cfg : null)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // Persist queue
  useEffect(() => {
    sessionStorage.setItem('ytf_queue', JSON.stringify(queue))
    saveQueueStats({
      pending:        queue.filter(j => j.status === 'waiting').length,
      processing:     queue.filter(j => j.status === 'processing').length,
      completedToday: queue.filter(j => j.status === 'completed').length,
      errorsToday:    queue.filter(j => j.status === 'error').length,
      lastUpdated:    new Date().toISOString(),
    })
  }, [queue])

  const addToQueue = () => {
    const prompts = promptsText.split('\n').filter((p: string) => p.trim().length > 0)
    if (!prompts.length) return
    setQueue((prev: Job[]) => [
      ...prev,
      ...prompts.map((prompt: string, i: number) => ({
        id: `job-${Date.now()}-${i}`,
        prompt: prompt.trim(),
        status: 'waiting' as JobStatus,
        model: modelInfo.label,
        aspectRatio, resolution,
      }))
    ])
    setPromptsText('')
  }

  const removeJob = (id: string) => setQueue(prev => prev.filter(j => j.id !== id))

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 14 - refImages.length)
    files.forEach(f => {
      setRefImages(prev => prev.length < 14 ? [...prev, { url: URL.createObjectURL(f), name: f.name }] : prev)
    })
    if (e.target) e.target.value = ''
  }

  const startProduction = useCallback(async () => {
    if (isRunning || runningRef.current) return
    const cfg = getApiConfig()
    if (!cfg.apiKey?.trim()) return  // button is disabled but guard anyway

    const waiting = queue.filter(j => j.status === 'waiting')
    if (!waiting.length) return

    setIsRunning(true)
    runningRef.current = true
    const bid = batchIdRef.current
    const savedImages: GeneratedImage[] = []

    for (let i = 0; i < waiting.length; i += concurrency) {
      const batch = waiting.slice(i, i + concurrency)

      // Mark batch as processing
      batch.forEach(job =>
        setQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j))
      )

      // Call real API concurrently within the batch
      await Promise.all(batch.map(async (job) => {
        const t0 = Date.now()
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: job.prompt,
              model: cfg.model,
              apiKey: cfg.apiKey,
              apiType: cfg.type,
              projectId: cfg.projectId,
              region: cfg.region,
              customEndpoint: cfg.customEndpoint,
              systemPrompt,
              aspectRatio: job.aspectRatio,
            }),
          })

          const data = await res.json()
          const dur = +((Date.now() - t0) / 1000).toFixed(1)

          if (data.ok) {
            setQueue(prev => prev.map(j =>
              j.id === job.id ? { ...j, status: 'completed', duration: dur, imageUrl: data.imageUrl } : j
            ))
            savedImages.push({
              id: job.id,
              name: `${job.prompt.slice(0, 28).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${data.mimeType?.includes('png') ? 'png' : 'jpg'}`,
              imageUrl: data.imageUrl,
              prompt: job.prompt,
              model: cfg.model,
              aspectRatio: job.aspectRatio,
              resolution: job.resolution,
              batchId: bid,
              duration: dur,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              locked: false,
            })
          } else {
            setQueue(prev => prev.map(j =>
              j.id === job.id ? { ...j, status: 'error', duration: dur, errorMsg: data.error || 'Error desconocido' } : j
            ))
          }
        } catch (e: unknown) {
          const dur = +((Date.now() - t0) / 1000).toFixed(1)
          setQueue(prev => prev.map(j =>
            j.id === job.id ? { ...j, status: 'error', duration: dur, errorMsg: e instanceof Error ? e.message : 'Error de red' } : j
          ))
        }
      }))
    }

    if (savedImages.length) addImages(savedImages)
    batchIdRef.current = `batch_${Date.now()}`
    setIsRunning(false)
    runningRef.current = false
  }, [queue, isRunning, concurrency, systemPrompt])

  const dlImage = (imageUrl: string, name: string) => {
    const a = document.createElement('a')
    // Same-origin: direct download. Cross-origin: proxy.
    if (imageUrl.startsWith('/')) {
      a.href = imageUrl
    } else {
      a.href = `/api/download?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}`
    }
    a.download = name
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const dlZip = async () => {
    const items = queue.filter(j => j.status === 'completed' && j.imageUrl)
    if (!items.length) return
    setIsZipping(true)
    try {
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: items.map((j, idx) => ({
            url: j.imageUrl!,
            name: `${j.prompt.slice(0, 28).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${idx + 1}.jpg`
          }))
        })
      })
      if (!res.ok) throw new Error('ZIP error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `ytf_batch_${Date.now()}.zip`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { alert('Error al generar ZIP') }
    setIsZipping(false)
  }

  const completedJobs   = queue.filter(j => j.status === 'completed')
  const waitingCount    = queue.filter(j => j.status === 'waiting').length
  const processingCount = queue.filter(j => j.status === 'processing').length
  const promptLines     = promptsText.split('\n').filter(p => p.trim()).length
  const hasApi          = !!apiCfg?.apiKey?.trim()
  const apiReady        = hasApi && apiCfg?.testStatus === 'ok'
  const canRun          = hasApi && !isRunning && waitingCount > 0

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div>
        <p className="text-xs mb-1" style={{ color: '#71717a' }}>Producción</p>
        <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Generación de imágenes</h1>
      </div>

      {/* API status banners */}
      {!hasApi && <NoApiBanner />}
      {hasApi && !apiReady && <UntestedBanner />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Config */}
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-xl border p-5 space-y-4" style={{ background: '#18181b', borderColor: '#27272a' }}>
            <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>A · Configuración del batch</h2>

            {/* Model */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Modelo</label>
              <div className="relative">
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-2 text-sm pr-8 outline-none border"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}>
                  {models.map(m => <option key={m.id} value={m.id}>{m.label} — {m.price}/img</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="text-xs mb-2 block" style={{ color: '#71717a' }}>Aspect ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(RATIO_SHAPES).map(r => (
                  <AspectBtn key={r} ratio={r} selected={aspectRatio === r} onClick={() => setAspectRatio(r)} />
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Resolución</label>
              <div className="flex gap-1.5">
                {RESOLUTIONS.map(r => (
                  <button key={r} onClick={() => setResolution(r)}
                    className="flex-1 py-1.5 rounded text-xs border transition-colors"
                    style={{ background: resolution === r ? 'rgba(16,185,129,0.15)' : '#09090b', borderColor: resolution === r ? '#10b981' : '#27272a', color: resolution === r ? '#34d399' : '#71717a' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* System prompt */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>System Prompt (opcional)</label>
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Estilo global para todos los prompts..." rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
            </div>

            {/* Reference images */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: '#71717a' }}>Imágenes de referencia ({refImages.length}/14)</label>
                {refImages.length > 0 && (
                  <button onClick={() => setRefImages([])} className="text-xs" style={{ color: '#ef4444' }}>Limpiar</button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleRefUpload} />
              {refImages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {refImages.map((img, i) => (
                    <div key={i} className="relative w-10 h-10 rounded overflow-hidden group" style={{ border: '1px solid #27272a' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setRefImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.7)' }}>
                        <X size={10} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {refImages.length < 14 && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-xs transition-colors"
                  style={{ borderColor: '#27272a', color: '#71717a' }}>
                  <Upload size={12} />Subir imágenes de referencia
                </button>
              )}
            </div>

            {/* Concurrency */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Concurrencia</label>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setConcurrency(n)}
                    className="flex-1 py-1.5 rounded text-xs border transition-colors"
                    style={{ background: concurrency === n ? 'rgba(16,185,129,0.15)' : '#09090b', borderColor: concurrency === n ? '#10b981' : '#27272a', color: concurrency === n ? '#34d399' : '#71717a' }}>
                    {n} job{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section B: Prompts */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: '#18181b', borderColor: '#27272a' }}>
            <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>B · Prompts</h2>
            <textarea value={promptsText} onChange={e => setPromptsText(e.target.value)}
              placeholder={"Un prompt por línea:\nA cinematic cityscape at dusk...\nMinimalist logo on dark background...\nDark fantasy forest with fog..."}
              rows={6}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none font-mono"
              style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#71717a' }}>
                {promptLines} prompts
              </span>
              <button onClick={addToQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: '#27272a', color: '#f4f4f5' }}>
                <Plus size={14} />Añadir a cola
              </button>
            </div>

            {waitingCount > 0 && (
              <div className="space-y-1 pt-1 border-t" style={{ borderColor: '#27272a' }}>
                <div className="text-xs mb-2" style={{ color: '#71717a' }}>{waitingCount} en cola</div>
                {queue.filter(j => j.status === 'waiting').map(job => (
                  <div key={job.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded" style={{ background: '#09090b' }}>
                    <span className="text-xs truncate flex-1 font-mono" style={{ color: '#a1a1aa' }}>{job.prompt}</span>
                    <button onClick={() => removeJob(job.id)}><X size={12} style={{ color: '#52525b' }} /></button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={hasApi ? startProduction : undefined}
              disabled={!canRun}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: !hasApi ? 'rgba(239,68,68,0.1)' : canRun ? '#10b981' : '#27272a',
                color: !hasApi ? '#ef4444' : canRun ? '#000' : '#52525b',
                cursor: canRun ? 'pointer' : 'not-allowed',
                borderWidth: !hasApi ? 1 : 0,
                borderStyle: 'solid',
                borderColor: !hasApi ? 'rgba(239,68,68,0.3)' : 'transparent',
              }}>
              {!hasApi ? (
                <><WifiOff size={14} />Sin API configurada</>
              ) : isRunning ? (
                <><Loader2 size={14} className="animate-spin" />Procesando {processingCount} jobs...</>
              ) : (
                <><Play size={14} />Iniciar producción</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Queue + Gallery */}
        <div className="xl:col-span-2 space-y-4">
          {queue.length === 0 && (
            <div className="rounded-xl border flex flex-col items-center justify-center py-20" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ background: '#27272a' }}>
                <Play size={20} style={{ color: '#52525b' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#f4f4f5' }}>Cola vacía</p>
              <p className="text-xs" style={{ color: '#71717a' }}>Añade prompts y lanza tu primer batch</p>
            </div>
          )}

          {queue.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
                <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>C · Cola</h2>
                <div className="flex gap-3 text-xs font-mono">
                  <span style={{ color: '#71717a' }}>{waitingCount} espera</span>
                  <span style={{ color: '#fbbf24' }}>{processingCount} proc.</span>
                  <span style={{ color: '#10b981' }}>{completedJobs.length} ok</span>
                  <span style={{ color: '#ef4444' }}>{queue.filter(j => j.status === 'error').length} err</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['#','Prompt','Estado','Modelo','Ratio','Res','Tiempo','Acc.'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: '#52525b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((job, i) => (
                      <tr key={job.id} style={{ borderBottom: '1px solid #1f1f22' }}>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#52525b' }}>{i + 1}</td>
                        <td className="px-4 py-2.5 max-w-[160px]">
                          <span className="block truncate font-mono" style={{ color: '#a1a1aa' }}>{job.prompt}</span>
                        </td>
                        <td className="px-4 py-2.5 min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICONS[job.status]}
                            <span style={{ color: job.status === 'completed' ? '#10b981' : job.status === 'error' ? '#ef4444' : job.status === 'processing' ? '#fbbf24' : '#71717a' }}>
                              {job.errorMsg ? (
                                <span title={job.errorMsg} className="cursor-help underline decoration-dotted">
                                  {job.errorMsg.length > 48 ? job.errorMsg.slice(0, 48) + '…' : job.errorMsg}
                                </span>
                              ) : STATUS_LABELS[job.status]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: '#71717a' }}>{job.model.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.aspectRatio}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.resolution}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.duration ? `${job.duration}s` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {job.status === 'completed' && job.imageUrl && (
                              <>
                                <button onClick={() => setPreview(job.imageUrl!)} className="p-1 rounded hover:bg-[#27272a]"><Eye size={12} style={{ color: '#71717a' }} /></button>
                                <button onClick={() => dlImage(job.imageUrl!, `${job.prompt.slice(0, 20).replace(/\s+/g, '_')}.jpg`)} className="p-1 rounded hover:bg-[#27272a]"><Download size={12} style={{ color: '#71717a' }} /></button>
                              </>
                            )}
                            {job.status === 'error' && (
                              <button onClick={() => setQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'waiting', errorMsg: undefined } : j))} className="p-1 rounded hover:bg-[#27272a]" title="Reintentar"><RefreshCw size={12} style={{ color: '#71717a' }} /></button>
                            )}
                            {job.status === 'waiting' && (
                              <button onClick={() => removeJob(job.id)} className="p-1 rounded hover:bg-[#27272a]"><Trash2 size={12} style={{ color: '#71717a' }} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {completedJobs.length > 0 && (
            <div className="rounded-xl border" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
                <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>D · Galería — {completedJobs.length} imágenes</h2>
                <div className="flex gap-2">
                  <button onClick={() => setQueue(prev => prev.filter(j => j.status !== 'completed'))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
                    style={{ borderColor: '#ef444433', color: '#ef4444', background: 'transparent' }}>
                    <Trash2 size={12} />Limpiar galería
                  </button>
                  <button onClick={dlZip} disabled={isZipping}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: isZipping ? '#27272a' : '#10b981', color: isZipping ? '#52525b' : '#000' }}>
                    {isZipping ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
                    {isZipping ? 'Generando ZIP...' : 'Descargar ZIP'}
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {completedJobs.map(job => (
                  <div key={job.id} className="group relative rounded-lg overflow-hidden border"
                    style={{ borderColor: '#27272a', aspectRatio: `${RATIO_DIMS[job.aspectRatio]?.w ?? 16}/${RATIO_DIMS[job.aspectRatio]?.h ?? 9}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={job.imageUrl} alt={job.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <button onClick={() => setPreview(job.imageUrl!)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <ZoomIn size={14} color="#fff" />
                      </button>
                      <button onClick={() => dlImage(job.imageUrl!, `${job.prompt.slice(0, 20).replace(/\s+/g, '_')}.jpg`)}
                        className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <Download size={14} color="#fff" />
                      </button>
                      <button onClick={() => removeJob(job.id)} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                      <p className="text-[10px] truncate font-mono" style={{ color: '#d4d4d8' }}>{job.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg"
              style={{ background: '#27272a', color: '#f4f4f5' }}>
              <X size={16} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full rounded-xl" />
            <button onClick={() => dlImage(preview, `ytf_preview_${Date.now()}.jpg`)}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#10b981', color: '#000' }}>
              <Download size={12} />Descargar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
