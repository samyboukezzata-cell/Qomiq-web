"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import type { DashboardSummary } from "@/types/api";
import { formatEuros, formatPct } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Placeholder dashboard — sera remplacé à l'étape 2
export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.summary()
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-[#0d9488] flex items-center justify-center">
            <span className="text-white font-bold">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(summary.pipeline.total_montant)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.pipeline.count} deal{summary.pipeline.count !== 1 ? "s" : ""}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">CA {summary.ca.current_month_label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(summary.ca.current_month)}</p>
                <p className={`text-xs mt-1 ${(summary.ca.growth_pct ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPct(summary.ca.growth_pct)} vs mois préc.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alertes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{summary.alerts.total_active}</p>
                <div className="flex gap-1 mt-1">
                  {summary.alerts.critical_count > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">{summary.alerts.critical_count} critique{summary.alerts.critical_count > 1 ? "s" : ""}</Badge>
                  )}
                  {summary.alerts.warning_count > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-amber-100 text-amber-800">{summary.alerts.warning_count} avert.</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Score de santé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: "#0d9488" }}>{summary.health_score}</p>
                <p className="text-xs text-gray-500 mt-1">sur 100</p>
              </CardContent>
            </Card>
          </div>
        )}

        {summary && !summary.has_data && (
          <div className="mt-8 text-center py-12 text-gray-400">
            <p className="text-lg font-medium">Aucune donnée pour l&apos;instant</p>
            <p className="text-sm mt-1">Importez vos données via l&apos;onglet Import</p>
          </div>
        )}
      </div>
    </div>
  );
}
