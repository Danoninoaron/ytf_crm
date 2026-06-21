import { Image, CheckCircle, Clock, DollarSign, Layers, Activity, AlertTriangle } from 'lucide-react'

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
  const pct = Math.round((used / total) * 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: '#71717a' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: pct > 80 ? '#ef4444' : pct > 60 ? '#fbbf24' : '#71717a' }}>
          {used}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : pct > 60 ? '#fbbf24' : color }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <p className="text-xs mb-1" style={{ color: '#71717a' }}>Dashboard</p>
        <h1 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>Panel de control</h1>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Imágenes hoy" value="47" sub="+12% vs ayer" icon={Image} color="#10b981" />
        <StatCard label="Esta semana" value="312" sub="Lun – Dom" icon={Layers} color="#6366f1" />
        <StatCard label="Tasa de éxito" value="94.3%" sub="28 errores totales" icon={CheckCircle} color="#10b981" />
        <StatCard label="Tiempo medio" value="4.2s" sub="Por imagen generada" icon={Clock} color="#fbbf24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Coste estimado — Junio</span>
            <DollarSign size={15} style={{ color: '#71717a' }} />
          </div>
          <div className="font-mono text-3xl font-bold mb-1" style={{ color: '#f4f4f5' }}>$12.40</div>
          <div className="text-xs mb-4" style={{ color: '#71717a' }}>de $50.00 presupuestado</div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
            <div className="h-full rounded-full" style={{ width: '24.8%', background: '#10b981' }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div style={{ color: '#71717a' }}>NB Flash</div>
              <div className="font-mono mt-0.5" style={{ color: '#f4f4f5' }}>$8.20</div>
            </div>
            <div>
              <div style={{ color: '#71717a' }}>Gemini Pro</div>
              <div className="font-mono mt-0.5" style={{ color: '#f4f4f5' }}>$4.20</div>
            </div>
          </div>
        </div>

        {/* Queue status */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Estado de la cola</span>
            <Activity size={15} style={{ color: '#71717a' }} />
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pendientes', value: '0', color: '#71717a' },
              { label: 'Procesando', value: '0', color: '#fbbf24' },
              { label: 'Completados hoy', value: '47', color: '#10b981' },
              { label: 'Errores hoy', value: '3', color: '#ef4444' },
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
        </div>

        {/* Rate limits */}
        <div className="rounded-xl p-5 border" style={{ background: '#18181b', borderColor: '#27272a' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Rate Limits</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>OK</span>
          </div>
          <div className="space-y-4">
            <RateBar label="RPM (solicitudes/min)" used={23} total={60} color="#10b981" />
            <RateBar label="RPD (solicitudes/día)" used={1240} total={10000} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Expiring soon */}
      <div className="rounded-xl border" style={{ background: '#18181b', borderColor: '#27272a' }}>
        <div className="p-5 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Próximos a expirar</span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: '#27272a' }}>
          {[
            { name: 'batch_20260617_cityscape', count: 8, days: 2, type: 'Imagen' },
            { name: 'batch_20260618_fantasy_art', count: 12, days: 5, type: 'Imagen' },
            { name: 'batch_20260614_logos', count: 4, days: 7, type: 'Imagen' },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-mono" style={{ color: '#f4f4f5' }}>{item.name}</div>
                <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>{item.count} archivos · {item.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded" style={{ background: item.days <= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)', color: item.days <= 3 ? '#ef4444' : '#fbbf24' }}>
                  Expira en {item.days}d
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
