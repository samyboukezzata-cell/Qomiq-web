"use client";

import { useEffect, useState } from "react";
import { Loader2, Bell } from "lucide-react";
import { alertsApi } from "@/lib/api";
import type { Alert } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

const LEVEL_COLORS: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  warning:  "bg-amber-50 border-amber-200 text-amber-800",
  info:     "bg-blue-50 border-blue-200 text-blue-800",
};

const LEVEL_LABELS: Record<string, string> = {
  critical: "Critique",
  warning:  "Avertissement",
  info:     "Info",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    alertsApi.list()
      .then(setAlerts)
      .catch(e => toast({ variant: "destructive", title: "Erreur", description: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id: string) => {
    try {
      await alertsApi.markRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: (e as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0d9488]" />
            <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">{alerts.length}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune alerte active</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${LEVEL_COLORS[alert.level] ?? ""} ${alert.is_read ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{alert.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full border font-medium opacity-70">
                        {LEVEL_LABELS[alert.level] ?? alert.level}
                      </span>
                      {!alert.is_read && (
                        <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                      )}
                    </div>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <p className="text-xs opacity-50 mt-1">{alert.created_at}</p>
                  </div>
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs h-7 px-2"
                      onClick={() => markRead(alert.id)}
                    >
                      Lue
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
