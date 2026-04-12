'use client'

import { useEffect, useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { healthApi } from '@/lib/api'
import type { HealthScoreResult } from '@/types/api'
import { toast } from '@/components/ui/toaster'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ScoreGauge({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-24 w-24 rounded-full border-8 flex items-center justify-center"
        style={{ borderColor: color }}
      >
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs text-gray-500">sur 100</span>
    </div>
  )
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#16a34a' : value >= 50 ? '#ea580c' : '#dc2626'
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-sm font-medium" style={{ color }}>{Math.round(value)}</span>
    </div>
  )
}

export default function HealthPage() {
  const [result, setResult] = useState<HealthScoreResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    healthApi.current()
      .then(setResult)
      .catch(e => toast({ variant: 'destructive', title: 'Erreur', description: e.message }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-900">Score de santé</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-8">
              <ScoreGauge score={result.score} color={result.color} />
              <div>
                <p className="text-2xl font-bold" style={{ color: result.color }}>{result.label}</p>
                <p className="text-sm text-gray-500 mt-1">Calculé le {result.computed_at}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Composantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComponentBar label="CA vs objectif"   value={result.component_ca} />
              <ComponentBar label="Pipeline"         value={result.component_pipeline} />
              <ComponentBar label="Taux de conversion" value={result.component_win_rate} />
              <ComponentBar label="Activité"         value={result.component_activite} />
              <ComponentBar label="Alertes"          value={result.component_alertes} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
