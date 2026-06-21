'use client'

import { useState, useEffect } from 'react'
import { Lock, Unlock, Download, Trash2, LayoutGrid, List, Filter, AlertTriangle, Shield } from 'lucide-react'
import { getImages, saveImages, updateImage, removeImage, clearTrail, type GeneratedImage } from '@/lib/content-store'

function ExpiryBadge({ days, locked }: { days: number; locked: boolean }) {
  if (locked) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
      <Shield size={9} />Bloqueado
    </span>
  )
  if (days <= 3) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
      <AlertTriangle size={9} />Expira en {days}d
    </span>
  )
  if (days <= 7) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
      Expira en {days}d
    </span>
  )
  return <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>{days}d</span>
}

type FilterType = 'all' | 'locked' | 'expiring'

export default function BibliotecaPage() {
  const [items, setItems] = useState<GeneratedImage[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [showErase, setShowErase] = useState(false)
  const [eraseText, setEraseText] = useState('')

  useEffect(() => {
    setItems(getImages())
    const id = setInterval(() => setItems(getImages()), 3000)
    return () => clearInterval(id)
  }, [])

  const daysLeft = (expiresAt: string) =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const toggle = (id: string, locked: boolean) => {
    updateImage(id, { locked })
    setItems(getImages())
  }

  const del = (id: string) => {
    removeImage(id)
    setItems(getImages())
  }

  const doErase = () => {
    clearTrail()
    setItems(getImages())
    setShowErase(false)
    setEraseText('')
  }

  const dlImage = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
    a.download = name
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const filtered = items.filter(i => {
    if (filter === 'locked') return i.locked
    if (filter === 'expiring') return !i.locked && daysLeft(i.expiresAt) <= 7
    return true
  })

  const lockedCount = items.filter(i => i.locked).length
  const expiringCount = items.filter(i => !i.locked && daysLeft(i.expiresAt) <= 7).length

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: '#71717a' }}>Contenido</p>
          <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Biblioteca</h1>
        </div>
        <button onClick={() => setShowErase(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
          style={{ borderColor: '#ef444433', color: '#ef4444', background: 'transparent' }}>
          <Trash2 size={14} />Borrar rastro
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: '#71717a' }} />
          {(['all', 'locked', 'expiring'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
              style={{ background: filter === f ? '#27272a' : 'transparent', borderColor: filter === f ? '#3f3f46' : '#27272a', color: filter === f ? '#f4f4f5' : '#71717a' }}>
              {f === 'all' ? `Todo (${items.length})` : f === 'locked' ? `🔒 Bloqueados (${lockedCount})` : `⚠ Expirando (${expiringCount})`}
            </button>
          ))}
        </div>
        <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: '#27272a' }}>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5"
              style={{ background: view === v ? '#27272a' : 'transparent', color: view === v ? '#f4f4f5' : '#71717a' }}>
              {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border flex flex-col items-center justify-center py-20" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#f4f4f5' }}>
            {items.length === 0 ? 'Biblioteca vacía' : 'Sin resultados para este filtro'}
          </p>
          <p className="text-xs" style={{ color: '#71717a' }}>
            {items.length === 0 ? 'Las imágenes generadas aparecerán aquí automáticamente' : 'Prueba otro filtro'}
          </p>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => {
            const days = daysLeft(item.expiresAt)
            return (
              <div key={item.id} className="group rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
                <div className="relative aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  {item.locked && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.85)' }}>
                      <Lock size={9} color="#fff" />
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2"
                    style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85))' }}>
                    <button onClick={() => toggle(item.id, !item.locked)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      {item.locked ? <Unlock size={11} color="#fff" /> : <Lock size={11} color="#fff" />}
                    </button>
                    <button onClick={() => dlImage(item.imageUrl, item.name)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <Download size={11} color="#fff" />
                    </button>
                    <button onClick={() => del(item.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)' }}>
                      <Trash2 size={11} color="#ef4444" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] font-mono truncate mb-1" style={{ color: '#a1a1aa' }}>{item.prompt || item.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>{item.resolution}</span>
                    <ExpiryBadge days={days} locked={item.locked} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #27272a' }}>
                {['Imagen', 'Prompt', 'Modelo', 'Res', 'Creado', 'Estado', 'Acc.'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#52525b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const days = daysLeft(item.expiresAt)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1f1f22' }}>
                    <td className="px-4 py-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt="" className="w-12 h-7 rounded object-cover" />
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px]">
                      <span className="block truncate text-xs font-mono" style={{ color: '#a1a1aa' }}>{item.prompt || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#71717a' }}>{item.model || '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#71717a' }}>{item.resolution}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#71717a' }}>
                      {new Date(item.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-2.5"><ExpiryBadge days={days} locked={item.locked} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggle(item.id, !item.locked)} title={item.locked ? 'Desbloquear' : 'Bloquear'}>
                          {item.locked ? <Unlock size={13} style={{ color: '#818cf8' }} /> : <Lock size={13} style={{ color: '#71717a' }} />}
                        </button>
                        <button onClick={() => dlImage(item.imageUrl, item.name)}><Download size={13} style={{ color: '#71717a' }} /></button>
                        <button onClick={() => del(item.id)}><Trash2 size={13} style={{ color: '#71717a' }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Borrar rastro modal */}
      {showErase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl border p-6 w-full max-w-md mx-4" style={{ background: '#18181b', borderColor: '#27272a' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Trash2 size={18} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: '#f4f4f5' }}>Borrar rastro</div>
                <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>Acción irreversible</div>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: '#a1a1aa' }}>
              Elimina la metadata de trazabilidad (prompt, modelo, usuario, coste) de todos los archivos. Los archivos físicos no se modifican.
            </p>
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>
                Escribe <span className="font-mono" style={{ color: '#ef4444' }}>BORRAR RASTRO</span> para confirmar
              </label>
              <input value={eraseText} onChange={e => setEraseText(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                placeholder="BORRAR RASTRO" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowErase(false); setEraseText('') }}
                className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: '#27272a', color: '#71717a', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={doErase} disabled={eraseText !== 'BORRAR RASTRO'}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: eraseText === 'BORRAR RASTRO' ? '#ef4444' : '#27272a',
                  color: eraseText === 'BORRAR RASTRO' ? '#fff' : '#52525b',
                  cursor: eraseText === 'BORRAR RASTRO' ? 'pointer' : 'not-allowed'
                }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
