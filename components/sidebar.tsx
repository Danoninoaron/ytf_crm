'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Image, FileText, Mic, Clapperboard,
  Library, Youtube, Key, ChevronDown, ChevronRight,
  Activity, Zap, Layers
} from 'lucide-react'

type ChildItem = { href: string; label: string; icon: React.ElementType; disabled?: boolean }
type NavItem =
  | { kind: 'link'; href: string; label: string; icon: React.ElementType; disabled?: boolean }
  | { kind: 'group'; label: string; icon: React.ElementType; children: ChildItem[] }

const navItems: NavItem[] = [
  { kind: 'link', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    kind: 'group', label: 'Producción', icon: Clapperboard,
    children: [
      { href: '/produccion/imagenes', label: 'Imágenes', icon: Image },
      { href: '/produccion/scripts', label: 'Scripts', icon: FileText, disabled: true },
      { href: '/produccion/voces', label: 'Voces', icon: Mic, disabled: true },
      { href: '/produccion/thumbnails', label: 'Thumbnails', icon: Layers, disabled: true },
    ]
  },
  { kind: 'link', href: '/biblioteca', label: 'Biblioteca', icon: Library },
  { kind: 'link', href: '/canales', label: 'Canales', icon: Youtube, disabled: true },
  { kind: 'link', href: '/apis', label: 'APIs', icon: Key },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [produccionOpen, setProduccionOpen] = useState(true)
  const [workerStatus] = useState<'idle' | 'active' | 'error'>('idle')
  const [rpmUsage] = useState(23)

  return (
    <div className="w-56 flex-shrink-0 flex flex-col h-screen border-r" style={{ background: '#18181b', borderColor: '#27272a' }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: '#27272a' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#10b981' }}>
            <Zap size={14} color="#000" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: '#f4f4f5' }}>YTF CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.kind === 'group') {
            const isActive = pathname?.startsWith('/produccion')
            return (
              <div key={item.label}>
                <button
                  onClick={() => setProduccionOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
                  style={{ color: isActive ? '#f4f4f5' : '#71717a', background: isActive ? '#27272a' : 'transparent' }}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </div>
                  {produccionOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                {produccionOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 pl-3 border-l" style={{ borderColor: '#27272a' }}>
                    {item.children.map((child) => {
                      if (child.disabled) {
                        return (
                          <div key={child.href} className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs cursor-not-allowed" style={{ color: '#3f3f46' }}>
                            <child.icon size={13} />
                            <span>{child.label}</span>
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#27272a', color: '#52525b' }}>Soon</span>
                          </div>
                        )
                      }
                      const isChildActive = pathname === child.href
                      return (
                        <Link key={child.href} href={child.href}
                          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors"
                          style={{ color: isChildActive ? '#34d399' : '#71717a', background: isChildActive ? 'rgba(16,185,129,0.1)' : 'transparent' }}
                        >
                          <child.icon size={13} />
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // kind === 'link'
          if (item.disabled) {
            return (
              <div key={item.href} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-not-allowed" style={{ color: '#3f3f46' }}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </div>
            )
          }
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
              style={{ color: isActive ? '#f4f4f5' : '#71717a', background: isActive ? '#27272a' : 'transparent' }}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Worker status */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: '#27272a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: workerStatus === 'active' ? '#10b981' : workerStatus === 'error' ? '#ef4444' : '#52525b' }} />
            <span className="text-xs" style={{ color: '#71717a' }}>
              {workerStatus === 'active' ? 'Procesando' : workerStatus === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>
          <Activity size={12} style={{ color: '#52525b' }} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>RPM</span>
            <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>{rpmUsage}/60</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(rpmUsage / 60) * 100}%`, background: rpmUsage > 48 ? '#ef4444' : rpmUsage > 36 ? '#fbbf24' : '#10b981' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
