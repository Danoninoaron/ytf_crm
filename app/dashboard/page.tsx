'use client'

import { useEffect, useState } from 'react'
import { Image, CheckCircle, Clock, DollarSign, Layers, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { getImages, getQueueStats, type GeneratedImage, type QueueStats } from '@/lib/content-store'

function StatCard({ label, value, sub, color = '#10b981', icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType
}) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm" style={{ color: '#71717a' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold" style={{ color: '#f4f4f5' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: '#71717a' }}>{sub}</div>}
    </div>
  )
}

function RateBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: '#71717a' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: pct > 80 ? '#ef4444' : pct > 60 ? '#fbbf24' : '#71717a' }}>
          {used}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : pct > 60 ? '#fbbf24' : color }} />
      </div>
    </div>
  )
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function DashboardPage() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [stats, setStats] = useState<QueueStats>({ pending: 0, processing: 0, completedToday: 0, errorsToday: 0, lastUpdated: '' })
  const [lastRefresh, setLastRefresh] = useState('')

  const refresh = () => {
    setImages(getImages())
    setStats(getQueueStats())
    setLastRefresh(new Date().toLocaleTimeString('es-ES'))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [])

  const today = images.filter(img => isToday(img.createdAt))
  const thisWeek = images.filter(img => {
    const d = new Date(img.createdAt)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })

  const totalImages = images.length
  const successRate = stats.completedToday + stats.errorsToday > 0
    ? Math.round((stats.completedToday / (stats.completedToday + stats.errorsToday)) * 100)
    : 100

  const avgDuration = images.length > 0
    ? (images.reduce((s, i) => s + (i.duration || 0), 0) / images.length).toFixed(1)
    : '—'

  const estCost = images.reduce((s, i) => s + 0.039, 0)

  const expiringSoon = images
    .filter(img => !img.locked)
    .map(img => ({ ...img, daysLeft: Math.ceil((new Date(img.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
    .filter(img => img.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: '#71717a' }}>Dashboard</p>
          <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Panel de control</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-xs font-mono" style={{ color: '#52525b' }}>Última actualización: {lastRefresh}</span>}
          <button onClick={refresh} className="p-2 rounded-lg border" style={{ borderColor: '#27272a', background: '#18181b' }}>
            <RefreshCw size={13} style={{ color: '#71717a' }} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Imágenes hoy" value={String(today.length)} sub={`${thisWeek.length} esta semana`} icon={Image} color="#10b981" />
        <StatCard label="Total generadas" value={String(totalImages)} sub="En biblioteca" icon={Layers} color="#6366f1" />
        <StatCard label="Tasa de éxito" value={`${successRate}%`} sub={`${stats.errorsToday} errores hoy`} icon={CheckCircle} color="#10b981" />
        <StatCard label="Tiempo medio" value={avgDuration === '—' ? '—' : `${avgDuration}s`} sub="Por imagen" icon={Clock} color="#fbbf24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Coste estimado</span>
            <DollarSign size={15} style={{ color: '#71717a' }} />
          </div>
          <div className="font-mono text-3xl font-bold mb-1" style={{ color: '#f4f4f5' }}>${estCost.toFixed(2)}</div>
          <div className="text-xs mb-4" style={{ color: '#71717a' }}>basado en {totalImages} imágenes generadas</div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min((estCost / 50) * 100, 100)}%`, background: '#10b981' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: '#52525b' }}>sobre $50 presupuestados</p>
        </div>

        {/* Queue */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Estado de la cola</span>
            <div className="flex items-center gap-1.5">
              {stats.processing > 0 && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />}
              <Activity size={15} style={{ color: '#71717a' }} />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pendientes',       value: stats.pending,        color: '#71717a' },
              { label: 'Procesando',       value: stats.processing,     color: '#fbbf24' },
              { label: 'Completados hoy',  value: stats.completedToday, color: '#10b981' },
              { label: 'Errores hoy',      value: stats.errorsToday,    color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: '#71717a' }}>{label}</span>
                </div>
                <span className="font-mono text-sm font-medium" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
          {stats.lastUpdated && (
            <p className="text-[10px] mt-3 pt-3 border-t font-mono" style={{ color: '#3f3f46', borderColor: '#27272a' }}>
              sync {new Date(stats.lastUpdated).toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>

        {/* Rate limits */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Rate Limits</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>OK</span>
          </div>
          <div className="space-y-4">
            <RateBar label="RPM (solicitudes/min)" used={stats.processing * 3} total={60} color="#10b981" />
            <RateBar label="RPD (solicitudes/día)" used={today.length} total={500} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="p-5 border-b" style={{ borderColor: '#27272a' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
              <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Próximos a expirar</span>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: '#27272a' }}>
            {expiringSoon.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className="w-10 h-6 rounded object-cover" />
                  <div>
                    <div className="text-xs font-mono" style={{ color: '#f4f4f5' }}>{item.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>{item.prompt?.slice(0, 40) || 'Sin prompt'}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: item.daysLeft <= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)', color: item.daysLeft <= 3 ? '#ef4444' : '#fbbf24' }}>
                  {item.daysLeft}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalImages === 0 && (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ background: '#27272a' }}>
            <Image size={20} style={{ color: '#52525b' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#f4f4f5' }}>Sin datos aún</p>
          <p className="text-xs" style={{ color: '#71717a' }}>Genera imágenes en Producción para ver las métricas aquí</p>
        </div>
      )}
    </div>
  )
}
