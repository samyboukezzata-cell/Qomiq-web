'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Briefcase, Plus, LayoutGrid, List,
  Loader2, ChevronUp, ChevronDown, Search,
  Pencil, Trash2,
} from 'lucide-react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { pipelineApi, ETAPES, type Deal, type PipelineStats } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { DealFormModal } from '@/components/pipeline/deal-form-modal'
import { Button } from '@/components/ui/button'

// ── Constantes & helpers ──────────────────────────────────────────────────────

const ETAPE_COLOR: Record<string, { bg: string; border: string; badge: string }> = {
  Prospect:      { bg: 'bg-gray-50',   border: 'border-gray-300',  badge: 'bg-gray-100 text-gray-600'   },
  Qualification: { bg: 'bg-blue-50',   border: 'border-blue-300',  badge: 'bg-blue-100 text-blue-700'   },
  Proposition:   { bg: 'bg-indigo-50', border: 'border-indigo-300',badge: 'bg-indigo-100 text-indigo-700'},
  Négociation:   { bg: 'bg-orange-50', border: 'border-orange-300',badge: 'bg-orange-100 text-orange-700'},
  Gagné:         { bg: 'bg-emerald-50',border: 'border-emerald-300',badge:'bg-emerald-100 text-emerald-700'},
  Perdu:         { bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-100 text-red-600'     },
}

const ETAPE_BAR: Record<string, string> = {
  Prospect:      'border-l-gray-400',
  Qualification: 'border-l-blue-500',
  Proposition:   'border-l-indigo-500',
  Négociation:   'border-l-orange-500',
  Gagné:         'border-l-emerald-500',
  Perdu:         'border-l-red-400',
}

function fmtEur(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)} k€`
  return `${v.toFixed(0)} €`
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function daysLabel(isoDate: string | null): { text: string; red: boolean } | null {
  if (!isoDate) return null
  const diff = Math.round((new Date(isoDate).getTime() - Date.now()) / 86400000)
  if (diff > 0) return { text: `Dans ${diff}j`, red: diff <= 7 }
  if (diff < 0) return { text: `Dépassé de ${-diff}j`, red: true }
  return { text: "Aujourd'hui", red: true }
}

// ── Sortable deal card (Kanban) ───────────────────────────────────────────────

function KanbanCard({
  deal, onEdit,
}: { deal: Deal; onEdit: (d: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const dl = daysLabel(deal.date_cloture)
  const color = ETAPE_BAR[deal.etape] ?? 'border-l-gray-300'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(deal)}
      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${color}
        p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none`}
    >
      <p className="font-semibold text-gray-900 text-sm truncate">{deal.nom}</p>
      <p className="text-xs text-gray-500 truncate mb-2">{deal.client}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-teal-700">{fmtEur(deal.montant)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
          ${deal.probabilite >= 75 ? 'bg-emerald-100 text-emerald-700'
          : deal.probabilite >= 40 ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-600'}`}>
          {deal.probabilite}%
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        {dl ? (
          <span className={`text-xs ${dl.red ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {dl.text}
          </span>
        ) : <span />}
        {deal.commercial && (
          <div className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
            {initials(deal.commercial)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  etape, deals, onEdit,
}: { etape: string; deals: Deal[]; onEdit: (d: Deal) => void }) {
  const c = ETAPE_COLOR[etape] ?? ETAPE_COLOR.Prospect
  const total = deals.reduce((s, d) => s + d.montant, 0)
  const ids = deals.map((d) => d.id)

  return (
    <div className={`flex flex-col rounded-xl border ${c.border} ${c.bg} w-full min-h-[400px]`}>
      <div className="px-3 py-2.5 border-b border-current/10">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{etape}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{deals.length}</span>
        </div>
        {total > 0 && <p className="text-xs text-gray-500">{fmtEur(total)}</p>}
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 flex-1 min-h-[120px]">
          {deals.map((d) => (
            <KanbanCard key={d.id} deal={d} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<Deal, 'nom' | 'client' | 'montant' | 'etape' | 'probabilite' | 'date_cloture' | 'commercial'>

function TableView({
  deals, onEdit, onDelete,
}: { deals: Deal[]; onEdit: (d: Deal) => void; onDelete: (d: Deal) => void }) {
  const [search,    setSearch]    = useState('')
  const [etapeF,    setEtapeF]    = useState('')
  const [sortKey,   setSortKey]   = useState<SortKey>('date_cloture')
  const [sortAsc,   setSortAsc]   = useState(true)
  const [page,      setPage]      = useState(1)
  const PAGE_SIZE = 25

  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = deals
    .filter((d) => {
      const s = search.toLowerCase()
      return (
        (!s || d.nom.toLowerCase().includes(s) || d.client.toLowerCase().includes(s)) &&
        (!etapeF || d.etape === etapeF)
      )
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), 'fr', { numeric: true })
      return sortAsc ? cmp : -cmp
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc((v) => !v)
    else { setSortKey(k); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : null

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">{label}<SortIcon k={k} /></span>
    </th>
  )

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher nom, client…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={etapeF}
          onChange={(e) => { setEtapeF(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Toutes les étapes</option>
          {ETAPES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th label="Nom"          k="nom"          />
              <Th label="Client"       k="client"       />
              <Th label="Montant"      k="montant"      />
              <Th label="Étape"        k="etape"        />
              <Th label="Proba"        k="probabilite"  />
              <Th label="Clôture"      k="date_cloture" />
              <Th label="Commercial"   k="commercial"   />
              <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucun deal trouvé.</td></tr>
            )}
            {paged.map((d) => {
              const c = ETAPE_COLOR[d.etape] ?? ETAPE_COLOR.Prospect
              const dl = daysLabel(d.date_cloture)
              return (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[180px] truncate">{d.nom}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.client}</td>
                  <td className="px-3 py-2.5 font-semibold text-teal-700">{fmtEur(d.montant)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                      {d.etape}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{d.probabilite}%</td>
                  <td className={`px-3 py-2.5 text-xs ${dl?.red ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {dl?.text ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{d.commercial ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {confirmId === d.id ? (
                        <div className="flex gap-1 text-xs">
                          <button onClick={() => { onDelete(d); setConfirmId(null) }} className="text-red-600 font-semibold px-1">Oui</button>
                          <button onClick={() => setConfirmId(null)} className="text-gray-500 px-1">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} deal{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                  p === page ? 'bg-teal-600 text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals,       setDeals]       = useState<Deal[]>([])
  const [stats,       setStats]       = useState<PipelineStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState<'kanban' | 'table'>('kanban')
  const [modalDeal,   setModalDeal]   = useState<Deal | null | undefined>(undefined) // undefined=fermé, null=nouveau
  const [activeId,    setActiveId]    = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([pipelineApi.list(), pipelineApi.stats()])
      setDeals(d)
      setStats(s)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur chargement', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const dealsByEtape = (etape: string) => deals.filter((d) => d.etape === etape)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    // Chercher la colonne de destination à partir de l'id de la carte over
    const overId   = String(over.id)
    const dealOver = deals.find((d) => d.id === overId)
    const newEtape = ETAPES.find((e) => e === overId) ?? dealOver?.etape
    if (!newEtape) return

    const draggedDeal = deals.find((d) => d.id === String(active.id))
    if (!draggedDeal || draggedDeal.etape === newEtape) return

    // Optimistic update
    const previous = deals
    setDeals((prev) =>
      prev.map((d) => d.id === draggedDeal.id ? { ...d, etape: newEtape } : d)
    )

    try {
      await pipelineApi.updateEtape(draggedDeal.id, { etape: newEtape })
      toast({ title: 'Deal mis à jour', description: `Déplacé vers ${newEtape}` })
      load()
    } catch (e) {
      setDeals(previous)
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleSave = async (data: Partial<Deal>) => {
    try {
      if (modalDeal) {
        await pipelineApi.update(modalDeal.id, data)
        toast({ title: 'Deal enregistré' })
      } else {
        await pipelineApi.create(data as Parameters<typeof pipelineApi.create>[0])
        toast({ title: 'Deal créé' })
      }
      setModalDeal(undefined)
      load()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
      throw e
    }
  }

  const handleDelete = async (deal: Deal) => {
    try {
      await pipelineApi.delete(deal.id)
      setModalDeal(undefined)
      toast({ title: 'Deal supprimé' })
      load()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    }
  }

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Commercial</h1>
            {stats && (
              <p className="text-sm text-gray-500">
                {stats.count_active} deal{stats.count_active !== 1 ? 's' : ''} actifs
                {stats.total_value > 0 && ` · ${fmtEur(stats.total_value)}`}
                {stats.win_rate > 0 && ` · Win rate : ${stats.win_rate}%`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === 'kanban' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === 'table' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
              Tableau
            </button>
          </div>
          <Button
            onClick={() => setModalDeal(null)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau deal
          </Button>
        </div>
      </div>

      {/* Vue Kanban */}
      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ETAPES.map((etape) => (
              <KanbanColumn
                key={etape}
                etape={etape}
                deals={dealsByEtape(etape)}
                onEdit={(d) => setModalDeal(d)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal && (
              <div className={`bg-white rounded-xl border-l-4 ${ETAPE_BAR[activeDeal.etape] ?? ''} border border-gray-200 p-3 shadow-xl w-56 rotate-1 cursor-grabbing`}>
                <p className="font-semibold text-gray-900 text-sm truncate">{activeDeal.nom}</p>
                <p className="text-xs text-gray-500">{activeDeal.client}</p>
                <p className="text-sm font-bold text-teal-700 mt-1">{fmtEur(activeDeal.montant)}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Vue Tableau */}
      {view === 'table' && (
        <TableView
          deals={deals}
          onEdit={(d) => setModalDeal(d)}
          onDelete={handleDelete}
        />
      )}

      {/* Modal création / édition */}
      {modalDeal !== undefined && (
        <DealFormModal
          deal={modalDeal}
          onSave={handleSave}
          onDelete={modalDeal ? () => handleDelete(modalDeal) : undefined}
          onClose={() => setModalDeal(undefined)}
        />
      )}
    </div>
  )
}
