'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Play, Plus, Trash2, Download, Eye, RefreshCw,
  ChevronDown, X, Loader2, CheckCircle, Clock, AlertCircle, ZoomIn
} from 'lucide-react'

type JobStatus = 'waiting' | 'processing' | 'completed' | 'error'
interface Job {
  id: string; prompt: string; status: JobStatus; model: string
  aspectRatio: string; resolution: string; duration?: number; imageUrl?: string
}

const MODELS = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash', price: '$0.003' },
  { id: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Preview', price: '$0.004' },
  { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Preview', price: '$0.012' },
]
const RATIOS = ['1:1','16:9','9:16','4:3','3:4','2:3','3:2','4:5','5:4','21:9']
const RESOLUTIONS = ['512','1K','2K','4K']
const STATUS_ICONS = {
  waiting: <Clock size={13} style={{ color: '#71717a' }} />,
  processing: <Loader2 size={13} className="animate-spin" style={{ color: '#fbbf24' }} />,
  completed: <CheckCircle size={13} style={{ color: '#10b981' }} />,
  error: <AlertCircle size={13} style={{ color: '#ef4444' }} />,
}
const STATUS_LABELS = { waiting: 'En espera', processing: 'Procesando', completed: 'Completado', error: 'Error' }

export default function ProduccionImagenesPage() {
  const [promptsText, setPromptsText] = useState('')
  const [queue, setQueue] = useState<Job[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('1K')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [concurrency, setConcurrency] = useState(1)
  const [preview, setPreview] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<'all' | null>(null)
  const runningRef = useRef(false)

  const modelLabel = MODELS.find(m => m.id === selectedModel)?.label ?? selectedModel
  const modelPrice = MODELS.find(m => m.id === selectedModel)?.price ?? ''

  const addToQueue = () => {
    const prompts = promptsText.split('\n').filter(p => p.trim())
    if (!prompts.length) return
    const newJobs: Job[] = prompts.map((prompt, i) => ({
      id: `job-${Date.now()}-${i}`,
      prompt: prompt.trim(),
      status: 'waiting',
      model: modelLabel,
      aspectRatio,
      resolution,
    }))
    setQueue(prev => [...prev, ...newJobs])
    setPromptsText('')
  }

  const removeJob = (id: string) => setQueue(prev => prev.filter(j => j.id !== id))

  const startProduction = useCallback(async () => {
    if (isRunning || runningRef.current) return
    const waiting = queue.filter(j => j.status === 'waiting')
    if (!waiting.length) return
    setIsRunning(true)
    runningRef.current = true

    for (let i = 0; i < waiting.length; i += concurrency) {
      const batch = waiting.slice(i, i + concurrency)
      batch.forEach(job => setQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j)))
      await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000))
      batch.forEach((job) => {
        const seed = job.id.split('-').slice(-1)[0]
        const dur = +(2.1 + Math.random() * 4.5).toFixed(1)
        const w = aspectRatio === '9:16' ? 450 : aspectRatio === '1:1' ? 600 : 800
        const h = aspectRatio === '9:16' ? 800 : aspectRatio === '1:1' ? 600 : 450
        setQueue(prev => prev.map(j => j.id === job.id ? {
          ...j, status: Math.random() > 0.08 ? 'completed' : 'error',
          duration: dur,
          imageUrl: `https://picsum.photos/seed/${seed}/${w}/${h}`
        } : j))
      })
    }
    setIsRunning(false)
    runningRef.current = false
  }, [queue, isRunning, concurrency, aspectRatio])

  const completedJobs = queue.filter(j => j.status === 'completed')
  const waitingCount = queue.filter(j => j.status === 'waiting').length
  const processingCount = queue.filter(j => j.status === 'processing').length

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <p className="text-xs mb-1" style={{ color: '#71717a' }}>Producción</p>
        <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Generación de imágenes</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Config + Prompts */}
        <div className="xl:col-span-1 space-y-4">
          {/* Section A: Batch config */}
          <div className="rounded-xl border p-5 space-y-4" style={{ background: '#18181b', borderColor: '#27272a' }}>
            <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>A · Configuración del batch</h2>

            {/* Model selector */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Modelo</label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-2 text-sm pr-8 outline-none border"
                  style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label} — {m.price}/img</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Aspect ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {RATIOS.map(r => (
                  <button key={r} onClick={() => setAspectRatio(r)}
                    className="px-2 py-1 rounded text-xs border transition-colors"
                    style={{
                      background: aspectRatio === r ? 'rgba(16,185,129,0.15)' : '#09090b',
                      borderColor: aspectRatio === r ? '#10b981' : '#27272a',
                      color: aspectRatio === r ? '#34d399' : '#71717a'
                    }}>
                    {r}
                  </button>
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
                    style={{
                      background: resolution === r ? 'rgba(16,185,129,0.15)' : '#09090b',
                      borderColor: resolution === r ? '#10b981' : '#27272a',
                      color: resolution === r ? '#34d399' : '#71717a'
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* System prompt */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>System Prompt (opcional)</label>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Estilo global para todos los prompts del batch..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
              />
            </div>

            {/* Concurrency */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Concurrencia</label>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setConcurrency(n)}
                    className="flex-1 py-1.5 rounded text-xs border transition-colors"
                    style={{
                      background: concurrency === n ? 'rgba(16,185,129,0.15)' : '#09090b',
                      borderColor: concurrency === n ? '#10b981' : '#27272a',
                      color: concurrency === n ? '#34d399' : '#71717a'
                    }}>
                    {n} job{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section B: Prompt input */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: '#18181b', borderColor: '#27272a' }}>
            <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>B · Prompts</h2>
            <textarea
              value={promptsText}
              onChange={e => setPromptsText(e.target.value)}
              placeholder={"Un prompt por línea:\nA cinematic cityscape at dusk...\nMinimalist logo on dark background...\nDark fantasy forest with fog..."}
              rows={6}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none font-mono"
              style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#71717a' }}>
                {promptsText.split('\n').filter(p => p.trim()).length} prompts · est. {
                  (promptsText.split('\n').filter(p => p.trim()).length * parseFloat(modelPrice.replace('$','') || '0')).toFixed(3)
                } USD
              </span>
              <button onClick={addToQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: '#27272a', color: '#f4f4f5' }}>
                <Plus size={14} />
                Añadir a cola
              </button>
            </div>

            {/* Queue preview */}
            {queue.filter(j => j.status === 'waiting').length > 0 && (
              <div className="space-y-1 pt-1 border-t" style={{ borderColor: '#27272a' }}>
                <div className="text-xs mb-2" style={{ color: '#71717a' }}>{waitingCount} en cola</div>
                {queue.filter(j => j.status === 'waiting').map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded" style={{ background: '#09090b' }}>
                    <span className="text-xs truncate flex-1 font-mono" style={{ color: '#a1a1aa' }}>{job.prompt}</span>
                    <button onClick={() => removeJob(job.id)}><X size={12} style={{ color: '#52525b' }} /></button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={startProduction} disabled={isRunning || waitingCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: isRunning || waitingCount === 0 ? '#27272a' : '#10b981',
                color: isRunning || waitingCount === 0 ? '#52525b' : '#000',
                cursor: isRunning || waitingCount === 0 ? 'not-allowed' : 'pointer'
              }}>
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isRunning ? `Procesando ${processingCount} jobs...` : 'Iniciar producción'}
            </button>
          </div>
        </div>

        {/* Right: Queue + Gallery */}
        <div className="xl:col-span-2 space-y-4">
          {/* Section C: Queue */}
          {queue.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
                <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>C · Cola de procesamiento</h2>
                <div className="flex gap-3 text-xs font-mono" style={{ color: '#71717a' }}>
                  <span style={{ color: '#71717a' }}>{waitingCount} espera</span>
                  <span style={{ color: '#fbbf24' }}>{processingCount} proc.</span>
                  <span style={{ color: '#10b981' }}>{completedJobs.length} ok</span>
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
                      <tr key={job.id} style={{ borderBottom: '1px solid #27272a' }}>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#52525b' }}>{i + 1}</td>
                        <td className="px-4 py-2.5 font-mono max-w-[180px]">
                          <span className="block truncate" style={{ color: '#a1a1aa' }}>{job.prompt}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICONS[job.status]}
                            <span style={{ color: job.status === 'completed' ? '#10b981' : job.status === 'error' ? '#ef4444' : job.status === 'processing' ? '#fbbf24' : '#71717a' }}>
                              {STATUS_LABELS[job.status]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: '#71717a' }}>{job.model.split(' ').slice(0,2).join(' ')}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.aspectRatio}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.resolution}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#71717a' }}>{job.duration ? `${job.duration}s` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {job.status === 'completed' && job.imageUrl && (
                              <>
                                <button onClick={() => setPreview(job.imageUrl!)} className="p-1 rounded hover:bg-[#27272a]"><Eye size={12} style={{ color: '#71717a' }} /></button>
                                <a href={job.imageUrl} download className="p-1 rounded hover:bg-[#27272a]"><Download size={12} style={{ color: '#71717a' }} /></a>
                              </>
                            )}
                            {job.status === 'error' && (
                              <button className="p-1 rounded hover:bg-[#27272a]"><RefreshCw size={12} style={{ color: '#71717a' }} /></button>
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

          {/* Section D: Gallery */}
          {completedJobs.length > 0 && (
            <div className="rounded-xl border" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
                <h2 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>D · Galería — {completedJobs.length} imágenes</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (window.confirm('¿Eliminar todas las imágenes del batch?')) setQueue(prev => prev.filter(j => j.status !== 'completed')) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: '#ef444433', color: '#ef4444', background: 'transparent' }}>
                    <Trash2 size={12} />Eliminar todas
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: '#10b981', color: '#000' }}>
                    <Download size={12} />Descargar ZIP
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {completedJobs.map((job) => (
                  <div key={job.id} className="group relative rounded-lg overflow-hidden border aspect-video"
                    style={{ borderColor: '#27272a' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={job.imageUrl} alt={job.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <button onClick={() => setPreview(job.imageUrl!)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <ZoomIn size={14} style={{ color: '#fff' }} />
                      </button>
                      <a href={job.imageUrl} download className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <Download size={14} style={{ color: '#fff' }} />
                      </a>
                      <button onClick={() => removeJob(job.id)} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)' }}>
                        <Trash2 size={14} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                      <p className="text-[10px] truncate font-mono" style={{ color: '#a1a1aa' }}>{job.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {queue.length === 0 && (
            <div className="rounded-xl border flex flex-col items-center justify-center py-20" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ background: '#27272a' }}>
                <Play size={20} style={{ color: '#52525b' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#f4f4f5' }}>Cola vacía</p>
              <p className="text-xs" style={{ color: '#71717a' }}>Añade prompts y lanza tu primer batch</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg"
              style={{ background: '#27272a', color: '#f4f4f5' }}>
              <X size={16} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
