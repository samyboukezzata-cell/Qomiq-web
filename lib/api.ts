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

  updateProfile: (data: { nom?: string; prenom?: string; secteur?: string }) =>
    request<UserResponse>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    current_password: string
    new_password: string
    confirm_password: string
  }) =>
    request<{ message: string }>("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  completeOnboarding: () =>
    request<UserResponse>("/auth/complete-onboarding", { method: "POST" }),

  resetOnboarding: () =>
    request<UserResponse>("/auth/reset-onboarding", { method: "POST" }),
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

// ── Import ────────────────────────────────────────────────────────────────────

export const importApi = {
  /** Upload multipart — pas de Content-Type (laissé au browser) */
  upload: async (file: File): Promise<Record<string, unknown>> => {
    const { getToken } = await import("./auth");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/import/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Erreur upload." }));
      throw new Error(typeof body.detail === "string" ? body.detail : "Erreur upload.");
    }
    return res.json();
  },

  validate: (payload: { mapping: Record<string, string>; data_type: string; rows: Record<string, unknown>[] }) =>
    request<{
      valid_rows: Record<string, unknown>[];
      invalid_rows: Record<string, unknown>[];
      warnings: string[];
      stats: { total: number; valid: number; invalid: number };
    }>("/import/validate", { method: "POST", body: JSON.stringify(payload) }),

  save: (payload: { data_type: string; rows: Record<string, unknown>[]; merge_strategy: string }) =>
    request<{ imported_count: number; data_type: string }>(
      "/import/save",
      { method: "POST", body: JSON.stringify(payload) }
    ),

  templateUrl: (dataType: string) => `${BASE_URL}/import/templates/${dataType}`,
};

// ── Health Score ──────────────────────────────────────────────────────────────

export const healthApi = {
  current: () => request<HealthScoreResult>("/health-score/current"),
  history: (weeks = 8) =>
    request<HealthScoreResult[]>(`/health-score/history?weeks=${weeks}`),
};

// ── Coach IA ──────────────────────────────────────────────────────────────────

export type AnalysisType = "pestel" | "bcg" | "ansoff" | "porter";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnalyzeResult {
  analysis_type: AnalysisType;
  content: string;
  model: string;
}

export interface HistoryEntry {
  type: AnalysisType;
  content: string;
  created_at: string;
}

// ── Présentation DG ───────────────────────────────────────────────────────────

export interface PresentationData {
  generated_at:  string
  period:        string
  user_name:     string
  secteur:       string
  kpis: {
    ca_mois_courant:       number
    ca_mois_precedent:     number
    ca_growth_pct:         number | null
    ca_label:              string
    pipeline_total:        number
    pipeline_count:        number
    pipeline_closing_soon: number
    budget_consomme_pct:   number
    budget_lignes_over:    number
  }
  ca_history:    { label: string; ca_realise: number; objectif: number }[]
  top_deals:     Record<string, unknown>[]
  health_score:  { score: number; label: string; color: string }
  alerts:        Record<string, unknown>[]
  last_analysis: string | null
}

export const presentationApi = {
  data: () => request<PresentationData>("/presentation/data"),

  exportPdf: async (payload: PresentationData): Promise<Blob> => {
    const { getToken } = await import("./auth")
    const res = await fetch(`${BASE_URL}/presentation/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Erreur PDF." }))
      throw new Error(typeof body.detail === "string" ? body.detail : "Erreur PDF.")
    }
    return res.blob()
  },
}

// ── Coach IA ──────────────────────────────────────────────────────────────────

export const coachApi = {
  analyze: (analysis_type: AnalysisType) =>
    request<AnalyzeResult>("/coach/analyze", {
      method: "POST",
      body: JSON.stringify({ analysis_type }),
    }),

  chat: (message: string, history: ChatMessage[]) =>
    request<ChatMessage>("/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  history: () => request<HistoryEntry[]>("/coach/history"),
};
