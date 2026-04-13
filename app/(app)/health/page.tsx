'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity, TrendingUp, Briefcase, Percent, Timer, Bell,
  RefreshCw, Loader2, Sparkles, Upload,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { healthApi } from '@/lib/api'
import type { HealthScoreResult, HealthHistoryPoint } from '@/types/api'

// ── Constantes ────────────────────────────────────────────────────────────────

interface ComponentDef {
  key: keyof Pick<HealthScoreResult,
    'component_ca' | 'component_pipeline' | 'component_win_rate' |
    'component_activite' | 'component_alertes'>
  label: string
  maxScore: number
  weight: number
  icon: React.ElementType
  describe: (v: number) => string
}

const COMPONENTS: ComponentDef[] = [
  {
    key: 'component_ca',
    label: 'Atteinte objectif CA',
    maxScore: 30,
    weight: 0.30,
    icon: TrendingUp,
    describe: v => v >= 80 ? 'Objectif mensuel atteint ou dépassé'
                : v >= 50 ? `${Math.round(v)}% de l'objectif mensuel`
                : 'CA en retard sur l\'objectif',
  },
  {
    key: 'component_pipeline',
    label: 'Richesse du pipeline',
    maxScore: 25,
    weight: 0.25,
    icon: Briefcase,
    describe: v => v >= 80 ? 'Pipeline solide et valorisé'
                : v >= 50 ? 'Pipeline en cours de constitution'
                : 'Pipeline faible — ajoutez des deals',
  },
  {
    key: 'component_win_rate',
    label: 'Taux de conversion',
    maxScore: 20,
    weight: 0.20,
    icon: Percent,
    describe: v => v >= 80 ? 'Excellent taux de conversion'
                : v >= 50 ? `Taux de conversion à améliorer`
                : 'Peu de deals conclus',
  },
  {
    key: 'component_activite',
    label: 'Activité commerciale',
    maxScore: 15,
    weight: 0.15,
    icon: Timer,
    describe: v => v >= 80 ? 'Deals à jour, aucun retard'
                : v >= 50 ? 'Quelques deals inactifs ou en retard'
                : 'Deals stagnants ou hors délai',
  },
  {
    key: 'component_alertes',
    label: 'Alertes actives',
    maxScore: 10,
    weight: 0.10,
    icon: Bell,
    describe: v => v >= 80 ? 'Aucune alerte critique'
                : v >= 50 ? 'Alertes warning à traiter'
                : 'Alertes critiques en attente',
  },
]

// ── Grade ─────────────────────────────────────────────────────────────────────

function getGrade(score: number): { grade: string; gradeLabel: string; color: string } {
  if (score >= 90) return { grade: 'A', gradeLabel: 'Excellent',    color: '#0d9488' }
  if (score >= 75) return { grade: 'B', gradeLabel: 'Bon',          color: '#16a34a' }
  if (score >= 60) return { grade: 'C', gradeLabel: 'Moyen',        color: '#ea580c' }
  if (score >= 40) return { grade: 'D', gradeLabel: 'Insuffisant',  color: '#dc2626' }
  return             { grade: 'F', gradeLabel: 'Critique',          color: '#991b1b' }
}

function barColor(ratio: number): string {
  if (ratio >= 0.8) return '#16a34a'
  if (ratio >= 0.5) return '#ea580c'
  return '#dc2626'
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function ScoreGauge({ score, delta }: { score: number; delta: number }) {
  const { grade, gradeLabel, color } = getGrade(score)
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-end gap-2">
        <span className="text-7xl font-semibold leading-none" style={{ color }}>{score}</span>
        <span className="text-2xl text-gray-400 font-light mb-2">/ 100</span>
      </div>

      {/* Barre de progression */}
      <div className="w-full max-w-xs">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Badge grade + delta */}
      <div className="flex items-center gap-3">
        <span
          className="px-3 py-1 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {grade} — {gradeLabel}
        </span>
        {delta !== 0 && (
          <span className={`text-sm font-medium ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta > 0 ? '+' : ''}{delta} pts cette semaine
          </span>
        )}
      </div>
    </div>
  )
}

function ComponentCard({ def, value }: { def: ComponentDef; value: number }) {
  const Icon = def.icon
  const scorePoints = Math.round(value * def.weight)
  const ratio = value / 100
  const color = barColor(ratio)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gray-50">
            <Icon className="h-4 w-4 text-gray-500" />
          </div>
          <span className="text-sm font-semibold text-gray-800">{def.label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {scorePoints}<span className="text-gray-400 font-normal">/{def.maxScore}</span>
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>

      <p className="text-xs text-gray-500">{def.describe(value)}</p>
    </div>
  )
}

function HistoryChart({ history }: { history: HealthHistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
        <TrendingUp className="h-10 w-10 opacity-30" />
        <p className="text-sm text-center text-gray-500">
          Revenez la semaine prochaine<br />pour voir l&apos;évolution de votre score
        </p>
      </div>
    )
  }

  const n = history.length
  const data = history.map((h, i) => ({
    label: i === n - 1 ? 'Cette semaine' : `S-${n - 1 - i}`,
    score: h.score,
    date: h.computed_at,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as typeof data[0]
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
                <p className="font-semibold text-gray-700">{d.label}</p>
                <p className="text-teal-600 font-bold">{d.score}/100</p>
                {d.date && <p className="text-gray-400">{fmtDate(d.date)}</p>}
              </div>
            )
          }}
        />
        <ReferenceLine
          y={75}
          stroke="#d1d5db"
          strokeDasharray="4 4"
          label={{ value: 'Objectif', position: 'right', fontSize: 10, fill: '#9ca3af' }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0d9488"
          strokeWidth={2}
          dot={<Dot r={4} fill="#0d9488" stroke="#fff" strokeWidth={2} />}
          activeDot={{ r: 6, fill: '#0d9488' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function HealthPage() {
  const router = useRouter()
  const [result, setResult] = useState<HealthScoreResult | null>(null)
  const [history, setHistory] = useState<HealthHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [current, hist] = await Promise.all([
        healthApi.current(),
        healthApi.history(8),
      ])
      setResult(current)
      setHistory(hist as unknown as HealthHistoryPoint[])
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoading(true)
    await load()
    setRefreshing(false)
  }

  // Delta : différence entre le score courant et l'avant-dernier point historique
  const delta = (() => {
    if (!result || history.length < 2) return 0
    const prev = history[history.length - 2]?.score ?? result.score
    return result.score - prev
  })()

  const isEmpty = !result || (result.score === 0 && result.inputs &&
    Object.values(result.inputs).every(v => v === 0))

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">Score de santé commerciale</h1>
          </div>
          {result && (
            <p className="text-sm text-gray-500 mt-1 ml-7">
              Semaine du {fmtDate(result.computed_at)}
              {result.secteur ? ` · ${result.secteur}` : ''}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : isEmpty ? (
        /* État vide */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Activity className="h-12 w-12 text-gray-200" />
            <div className="text-center">
              <p className="font-semibold text-gray-700">Aucune donnée disponible</p>
              <p className="text-sm text-gray-500 mt-1">
                Importez vos données pour calculer votre score de santé commerciale
              </p>
            </div>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white mt-2"
              onClick={() => router.push('/import')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer des données
            </Button>
          </CardContent>
        </Card>
      ) : result && (
        <>
          {/* Jauge principale */}
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-6">
              <ScoreGauge score={result.score} delta={delta} />
            </CardContent>
          </Card>

          {/* Composantes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800">
                Détail par composante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMPONENTS.map(def => (
                <ComponentCard key={def.key} def={def} value={result[def.key]} />
              ))}
            </CardContent>
          </Card>

          {/* Historique */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800">
                Évolution sur 8 semaines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryChart history={history} />
            </CardContent>
          </Card>

          {/* Coach IA */}
          <div className="flex justify-center pb-4">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2 px-6"
              onClick={() => router.push('/dashboard')}
            >
              <Sparkles className="h-4 w-4" />
              Obtenir des recommandations IA →
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
