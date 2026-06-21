'use client'

import { useState } from 'react'
import { Lock, Unlock, Download, Trash2, LayoutGrid, List, Filter, AlertTriangle, Shield } from 'lucide-react'

type ContentItem = {
  id: string; name: string; type: 'image'; size: string; createdAt: string
  expiresIn: number; locked: boolean; batchId: string; thumb: string
}

const MOCK_ITEMS: ContentItem[] = [
  { id: '1', name: 'cityscape_dusk_01.webp', type: 'image', size: '2.1 MB', createdAt: '2026-06-21', expiresIn: 30, locked: false, batchId: 'batch_001', thumb: 'https://picsum.photos/seed/a1/400/225' },
  { id: '2', name: 'dark_fantasy_forest.webp', type: 'image', size: '1.8 MB', createdAt: '2026-06-21', expiresIn: 30, locked: false, batchId: 'batch_001', thumb: 'https://picsum.photos/seed/a2/400/225' },
  { id: '3', name: 'minimalist_logo_v2.webp', type: 'image', size: '0.9 MB', createdAt: '2026-06-20', expiresIn: 29, locked: true, batchId: 'batch_001', thumb: 'https://picsum.photos/seed/a3/400/225' },
  { id: '4', name: 'abstract_waves_hd.webp', type: 'image', size: '3.2 MB', createdAt: '2026-06-18', expiresIn: 27, locked: false, batchId: 'batch_002', thumb: 'https://picsum.photos/seed/a4/400/225' },
  { id: '5', name: 'neon_city_rain.webp', type: 'image', size: '2.7 MB', createdAt: '2026-06-17', expiresIn: 2, locked: false, batchId: 'batch_003', thumb: 'https://picsum.photos/seed/a5/400/225' },
  { id: '6', name: 'quantum_tech_bg.webp', type: 'image', size: '1.5 MB', createdAt: '2026-06-16', expiresIn: 5, locked: false, batchId: 'batch_003', thumb: 'https://picsum.photos/seed/a6/400/225' },
  { id: '7', name: 'cosmic_galaxy_4k.webp', type: 'image', size: '4.1 MB', createdAt: '2026-06-15', expiresIn: 7, locked: true, batchId: 'batch_004', thumb: 'https://picsum.photos/seed/a7/400/225' },
  { id: '8', name: 'retro_synthwave_v3.webp', type: 'image', size: '2.3 MB', createdAt: '2026-06-14', expiresIn: 7, locked: false, batchId: 'batch_004', thumb: 'https://picsum.photos/seed/a8/400/225' },
]

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
  return <span className="text-[10px]" style={{ color: '#52525b' }}>Expira en {days}d</span>
}

export default function BibliotecaPage() {
  const [items, setItems] = useState<ContentItem[]>(MOCK_ITEMS)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'expiring'>('all')
  const [showErase, setShowErase] = useState(false)
  const [eraseText, setEraseText] = useState('')

  const toggleLock = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, locked: !i.locked } : i))
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const filtered = items.filter(i => {
    if (filterStatus === 'locked') return i.locked
    if (filterStatus === 'expiring') return !i.locked && i.expiresIn <= 7
    return true
  })

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: '#71717a' }}>Contenido</p>
          <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Biblioteca</h1>
        </div>
        <button onClick={() => setShowErase(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors"
          style={{ borderColor: '#ef444433', color: '#ef4444', background: 'transparent' }}>
          <Trash2 size={14} />Borrar rastro
        </button>
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: '#71717a' }} />
          {(['all', 'locked', 'expiring'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
              style={{
                background: filterStatus === f ? '#27272a' : 'transparent',
                borderColor: filterStatus === f ? '#3f3f46' : '#27272a',
                color: filterStatus === f ? '#f4f4f5' : '#71717a'
              }}>
              {f === 'all' ? `Todo (${items.length})` : f === 'locked' ? `🔒 Bloqueados (${items.filter(i => i.locked).length})` : `⚠ Expirando pronto (${items.filter(i => !i.locked && i.expiresIn <= 7).length})`}
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

      {/* Content */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="group rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
              <div className="relative aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumb} alt={item.name} className="w-full h-full object-cover" />
                {item.locked && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.85)' }}>
                    <Lock size={10} color="#fff" />
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2"
                  style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))' }}>
                  <button onClick={() => toggleLock(item.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    {item.locked ? <Unlock size={12} color="#fff" /> : <Lock size={12} color="#fff" />}
                  </button>
                  <button className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <Download size={12} color="#fff" />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)' }}>
                    <Trash2 size={12} color="#ef4444" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-mono truncate mb-1.5" style={{ color: '#a1a1aa' }}>{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>{item.size}</span>
                  <ExpiryBadge days={item.expiresIn} locked={item.locked} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #27272a' }}>
                {['Archivo', 'Tipo', 'Tamaño', 'Creado', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: '#52525b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #27272a' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumb} alt="" className="w-10 h-6 rounded object-cover" />
                      <span className="text-xs font-mono" style={{ color: '#f4f4f5' }}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#71717a' }}>Imagen</td>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: '#71717a' }}>{item.size}</td>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: '#71717a' }}>{item.createdAt}</td>
                  <td className="px-5 py-3"><ExpiryBadge days={item.expiresIn} locked={item.locked} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLock(item.id)} title={item.locked ? 'Desbloquear' : 'Bloquear'}>
                        {item.locked ? <Unlock size={13} style={{ color: '#818cf8' }} /> : <Lock size={13} style={{ color: '#71717a' }} />}
                      </button>
                      <button><Download size={13} style={{ color: '#71717a' }} /></button>
                      <button onClick={() => removeItem(item.id)}><Trash2 size={13} style={{ color: '#71717a' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Borrar rastro modal */}
      {showErase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{ background: '#18181b', borderColor: '#27272a' }}>
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
              Esto eliminará toda la metadata de trazabilidad (prompt, modelo, usuario, coste) de todos los archivos. Los archivos físicos no se modifican.
            </p>
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: '#71717a' }}>Escribe <span className="font-mono" style={{ color: '#ef4444' }}>BORRAR RASTRO</span> para confirmar</label>
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
              <button
                disabled={eraseText !== 'BORRAR RASTRO'}
                onClick={() => { setShowErase(false); setEraseText('') }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: eraseText === 'BORRAR RASTRO' ? '#ef4444' : '#27272a',
                  color: eraseText === 'BORRAR RASTRO' ? '#fff' : '#52525b',
                  cursor: eraseText === 'BORRAR RASTRO' ? 'pointer' : 'not-allowed'
                }}>
                Confirmar borrado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
