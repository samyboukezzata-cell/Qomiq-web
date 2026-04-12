// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DealSummary {
  nom: string;
  client: string;
  montant: number;
  days_until_close: number | null;
}

export interface PipelineStats {
  total_montant: number;
  count: number;
  closing_soon_count: number;
  top_deals: DealSummary[];
}

export interface CaStats {
  current_month: number;
  previous_month: number;
  growth_pct: number | null;
  current_month_label: string;
  objectif: number;
  objectif_pct: number;
  is_behind: boolean;
}

export interface BudgetStats {
  total_budget: number;
  total_reel: number;
  consumed_pct: number;
  lines_over_budget: number;
}

export interface AlertStats {
  total_active: number;
  critical_count: number;
  warning_count: number;
}

export interface ActionItem {
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface CaHistoryPoint {
  mois: string;
  label: string;
  ca_realise: number;
  objectif: number;
}

export interface DashboardSummary {
  pipeline: PipelineStats;
  ca: CaStats;
  budget: BudgetStats;
  alerts: AlertStats;
  computed_at: string;
  has_data: boolean;
  health_score: number;
  health_delta: number;
  ca_history: CaHistoryPoint[];
  actions: ActionItem[];
}

// ── Alertes ───────────────────────────────────────────────────────────────────

export type AlertLevel = "critical" | "warning" | "info";
export type AlertType = "deal_stale" | "deal_closing" | "stock_low" | "budget_overrun";

export interface Alert {
  id: string;
  alert_type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  entity_id: string;
  entity_data: Record<string, unknown>;
  created_at: string;
  is_read: boolean;
  is_dismissed: boolean;
}

// ── Health Score ──────────────────────────────────────────────────────────────

export interface HealthScoreResult {
  score: number;
  label: string;
  color: string;
  component_ca: number;
  component_pipeline: number;
  component_win_rate: number;
  component_activite: number;
  component_alertes: number;
  computed_at: string;
  secteur: string;
  inputs: Record<string, number>;
}

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
