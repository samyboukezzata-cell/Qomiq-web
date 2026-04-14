'use client'

import { useState, useEffect } from 'react'
import {
  MonitorPlay, Download, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Briefcase, Activity,
  AlertTriangle, Brain, BarChart2, Maximize, Minimize,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { presentationApi, type PresentationData } from '@/lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEur(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)} k€`
  return `${v.toFixed(0)} €`
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) return <span className="text-xs text-gray-400">N/A</span>
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string
  value: string
  sub?: React.ReactNode
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 flex gap-3 items-start ${accent ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-white'}`}>
      <div className={`p-2 rounded-lg ${accent ? 'bg-teal-100' : 'bg-gray-100'}`}>
        <Icon className={`h-4 w-4 ${accent ? 'text-teal-700' : 'text-gray-600'}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <div className="mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PresentationPage() {
  const [data, setData] = useState<PresentationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const d = await presentationApi.data()
      setData(d)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur chargement', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleExport = async () => {
    if (!data) return
    setExporting(true)
    try {
      const blob = await presentationApi.exportPdf(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-qomiq-${data.generated_at}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur export PDF', description: (e as Error).message })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!data) return null

  const { kpis, ca_history, top_deals, health_score, alerts, last_analysis } = data

  const healthGrade = health_score.score >= 90 ? 'A' : health_score.score >= 75 ? 'B'
    : health_score.score >= 60 ? 'C' : health_score.score >= 40 ? 'D' : 'F'
  const healthColor = health_score.score >= 75 ? 'text-emerald-600' : health_score.score >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-8' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorPlay className="h-6 w-6 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mode Présentation DG</h1>
            <p className="text-sm text-gray-500">
              {data.period} — Généré le {data.generated_at}
              {data.user_name && ` · ${data.user_name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4 mr-1.5" /> : <Maximize className="h-4 w-4 mr-1.5" />}
            {isFullscreen ? 'Quitter' : 'Plein écran'}
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            size="sm"
          >
            {exporting
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : <Download className="h-4 w-4 mr-1.5" />
            }
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Synthèse commerciale</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard
            label={`CA ${kpis.ca_label ?? 'mois courant'}`}
            value={fmtEur(kpis.ca_mois_courant)}
            sub={<GrowthBadge pct={kpis.ca_growth_pct} />}
            icon={BarChart2}
            accent
          />
          <KpiCard
            label="CA mois précédent"
            value={fmtEur(kpis.ca_mois_precedent)}
            icon={BarChart2}
          />
          <KpiCard
            label="Pipeline total"
            value={fmtEur(kpis.pipeline_total)}
            sub={<span className="text-xs text-gray-400">{kpis.pipeline_count} deal{kpis.pipeline_count !== 1 ? 's' : ''}</span>}
            icon={Briefcase}
          />
          <KpiCard
            label="Clôtures imminentes"
            value={String(kpis.pipeline_closing_soon)}
            sub={<span className="text-xs text-gray-400">≤ 7 jours</span>}
            icon={TrendingUp}
          />
          <KpiCard
            label="Budget consommé"
            value={`${kpis.budget_consomme_pct.toFixed(0)}%`}
            sub={kpis.budget_lignes_over > 0
              ? <span className="text-xs text-red-500">{kpis.budget_lignes_over} ligne(s) dépassée(s)</span>
              : <span className="text-xs text-emerald-600">Dans le budget</span>
            }
            icon={Activity}
          />
          <KpiCard
            label="Score de santé"
            value={`${health_score.score}/100`}
            sub={<span className={`text-xs font-bold ${healthColor}`}>Grade {healthGrade} — {health_score.label}</span>}
            icon={Activity}
            accent={health_score.score >= 75}
          />
        </div>
      </section>

      {/* CA History */}
      {ca_history.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-teal-600" />
              Évolution CA — 6 derniers mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="text-left px-3 py-2 font-semibold rounded-tl">Mois</th>
                    <th className="text-right px-3 py-2 font-semibold">CA Réalisé</th>
                    <th className="text-right px-3 py-2 font-semibold rounded-tr">Objectif</th>
                  </tr>
                </thead>
                <tbody>
                  {ca_history.map((row, i) => {
                    const pct = row.objectif > 0 ? (row.ca_realise / row.objectif) * 100 : null
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-teal-50'}>
                        <td className="px-3 py-2 text-gray-700">{row.label}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{fmtEur(row.ca_realise)}</td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {row.objectif > 0 ? fmtEur(row.objectif) : '—'}
                          {pct !== null && (
                            <span className={`ml-2 text-xs font-semibold ${pct >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
                              ({pct.toFixed(0)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Deals */}
      {top_deals.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-teal-600" />
              Top 5 opportunités pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="text-left px-3 py-2 font-semibold rounded-tl">Opportunité</th>
                    <th className="text-left px-3 py-2 font-semibold">Client</th>
                    <th className="text-right px-3 py-2 font-semibold">Montant</th>
                    <th className="text-left px-3 py-2 font-semibold">Étape</th>
                    <th className="text-left px-3 py-2 font-semibold rounded-tr">Clôture</th>
                  </tr>
                </thead>
                <tbody>
                  {top_deals.map((deal, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-teal-50'}>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate">
                        {String(deal.nom ?? '—')}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{String(deal.client ?? '—')}</td>
                      <td className="px-3 py-2 text-right font-semibold text-teal-700">
                        {fmtEur(parseFloat(String(deal.montant ?? '0')))}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {String(deal.etape ?? deal.statut ?? '—')}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {String(deal.date_cloture ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertes actives ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => {
              const level = String(alert.level ?? 'info')
              const isCritical = level === 'critical'
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                    isCritical
                      ? 'border-l-red-500 bg-red-50'
                      : 'border-l-amber-400 bg-amber-50'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{String(alert.title ?? '')}</p>
                    <p className="text-xs text-gray-600">{String(alert.message ?? '')}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Last IA Analysis */}
      {last_analysis && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Brain className="h-4 w-4 text-teal-600" />
              Dernière analyse stratégique (Coach IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm prose-gray max-w-none
              prose-headings:font-semibold prose-headings:text-gray-800
              prose-h2:text-base prose-h3:text-sm
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-li:text-gray-600 prose-strong:text-gray-800
              prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
              <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                {last_analysis}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
