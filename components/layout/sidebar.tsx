'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Bell, Activity, Upload, Brain, MonitorPlay, Settings, LogOut } from 'lucide-react'
import { removeToken } from '@/lib/auth'
import { alertsApi } from '@/lib/api'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    alertsApi.list({ unread_only: true })
      .then(data => setUnreadCount(data.length))
      .catch(() => null)
  }, [])

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, badge: 0 },
    { href: '/alerts',    label: 'Alertes',          icon: Bell,            badge: unreadCount },
    { href: '/health',    label: 'Score de santé',   icon: Activity,        badge: 0 },
    { href: '/import',    label: 'Import données',   icon: Upload,          badge: 0 },
    { href: '/coach',        label: 'Coach IA',          icon: Brain,        badge: 0 },
    { href: '/presentation', label: 'Mode Présentation', icon: MonitorPlay,  badge: 0 },
    { href: '/settings',     label: 'Paramètres',        icon: Settings,     badge: 0 },
  ]

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Qomiq</p>
            <p className="text-xs text-gray-500">Intelligence Commerciale</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
