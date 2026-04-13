'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCircle2, RefreshCw, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { alertsApi } from '@/lib/api'
import type { Alert, AlertLevel } from '@/types/api'

// ── Constantes ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const LEVEL_DOT: Record<AlertLevel, string> = {
  critical: '#dc2626',
  warning:  '#ea580c',
  info:     '#2563eb',
}

const LEVEL_BORDER: Record<AlertLevel, string> = {
  critical: 'border-l-[3px] border-l-red-600',
  warning:  'border-l-[3px] border-l-orange-600',
  info:     'border-l-[3px] border-l-blue-600',
}

const LEVEL_BG: Record<AlertLevel, string> = {
  critical: 'bg-red-50',
  warning:  'bg-orange-50',
  info:     'bg-blue-50',
}

const LEVEL_LABELS: Record<AlertLevel, string> = {
  critical: 'CRITIQUE',
  warning:  'AVERTISSEMENT',
  info:     'INFO',
}

const LEVEL_BADGE: Record<AlertLevel, string> = {
  critical: 'text-red-700 bg-red-100',
  warning:  'text-orange-700 bg-orange-100',
  info:     'text-blue-700 bg-blue-100',
}

type FilterType = 'all' | AlertLevel | 'unread'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all',      label: 'Tout' },
  { value: 'critical', label: 'Critique' },
  { value: 'warning',  label: 'Avertissement' },
  { value: 'info',     label: 'Info' },
  { value: 'unread',   label: 'Non lues' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `Il y a ${Math.max(1, minutes)} minute${minutes > 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`
}

// ── AlertCard ─────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onRead,
  onDismiss,
}: {
  alert: Alert
  onRead: (id: string) => Promise<void>
  onDismiss: (id: string) => void
}) {
  const [reading, setReading] = useState(false)

  const handleRead = async () => {
    setReading(true)
    await onRead(alert.id)
    setReading(false)
  }

  return (
    <div
      className={`rounded-lg border ${LEVEL_BG[alert.level] ?? 'bg-gray-50'} ${LEVEL_BORDER[alert.level] ?? ''} p-4 transition-opacity ${alert.is_read ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Point coloré */}
          <span
            className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: LEVEL_DOT[alert.level] ?? '#6b7280' }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{alert.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{relativeTime(alert.created_at)}</span>
              <span className="text-gray-300">·</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${LEVEL_BADGE[alert.level] ?? ''}`}>
                {LEVEL_LABELS[alert.level] ?? alert.level.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!alert.is_read && (
            <button
              onClick={handleRead}
              disabled={reading}
              title="Marquer comme lu"
              className="p-1.5 rounded-md text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
            >
              {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={() => onDismiss(alert.id)}
            title="Ignorer"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await alertsApi.list()
      setAlerts(data.filter(a => !a.is_dismissed))
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await alertsApi.refresh()
      await load()
      toast({ title: 'Alertes rafraîchies' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    } finally {
      setRefreshing(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await alertsApi.markRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    }
  }

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read)
    await Promise.all(unread.map(a => alertsApi.markRead(a.id).catch(() => null)))
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
  }

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  // Filtrage côté client
  const filtered = alerts.filter(a => {
    if (filter === 'all')    return true
    if (filter === 'unread') return !a.is_read
    return a.level === filter
  })

  const unreadCount = alerts.filter(a => !a.is_read).length
  const allRead = unreadCount === 0

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const setFilterAndReset = (f: FilterType) => {
    setFilter(f)
    setPage(1)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          <span className="text-sm text-gray-500 font-medium">
            {alerts.length} alerte{alerts.length !== 1 ? 's' : ''} active{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={allRead}
            onClick={handleMarkAllRead}
            className="text-xs"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Tout marquer lu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterAndReset(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.value === 'unread' && unreadCount > 0 && (
              <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                filter === 'unread' ? 'bg-white text-teal-700' : 'bg-red-100 text-red-700'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Aucune alerte active</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRead={handleMarkRead}
                onDismiss={handleDismiss}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Précédent
              </Button>
              <span className="text-sm text-gray-500 font-medium">
                Page {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
