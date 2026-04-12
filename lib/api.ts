import { authHeaders } from "./auth";
import type {
  Alert,
  DashboardSummary,
  HealthScoreResult,
  LoginPayload,
  RegisterPayload,
  Token,
  UserResponse,
} from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://qomiq-api.onrender.com";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Erreur réseau." }));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
        ? body.detail.map((e: { msg: string }) => e.msg).join(", ")
        : "Erreur inconnue.";
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<UserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<Token>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<UserResponse>("/auth/me"),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () => request<DashboardSummary>("/dashboard/summary"),
  kpis: () => request<Record<string, unknown>>("/dashboard/kpis"),
};

// ── Alertes ───────────────────────────────────────────────────────────────────

export const alertsApi = {
  list: (params?: { level?: string; unread_only?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.level) qs.set("level", params.level);
    if (params?.unread_only) qs.set("unread_only", "true");
    const query = qs.toString() ? `?${qs}` : "";
    return request<Alert[]>(`/alerts/${query}`);
  },

  markRead: (alertId: string) =>
    request<{ ok: boolean; alert_id: string }>(`/alerts/${alertId}/read`, {
      method: "PATCH",
    }),

  refresh: () =>
    request<{ count: number; critical: number; warning: number }>(
      "/alerts/refresh",
      { method: "POST" }
    ),
};

// ── Health Score ──────────────────────────────────────────────────────────────

export const healthApi = {
  current: () => request<HealthScoreResult>("/health-score/current"),
  history: (weeks = 8) =>
    request<HealthScoreResult[]>(`/health-score/history?weeks=${weeks}`),
};
