// src/modules/dashboard/types/index.ts
export type GroupBy = "day" | "week" | "month";

export interface RangeParams {
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
}

export interface ApiEnvelope<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AnalyticsEvent {
  _id?: string;
  userId?: string;
  module: string;
  eventType: string;
  path?: string;
  method?: string;
  ip?: string;
  country?: string;
  city?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  userAgent?: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
  status?: number;
  message?: string;
  meta?: Record<string, any>;
  uploadedFiles?: string[];
  language: string;
  timestamp?: string;
  tenant?: string;
}

export interface AnalyticsState {
  events: AnalyticsEvent[];
  count: number;
  trends: any[]; // isteğe göre genişletilebilir
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Logs */
export interface DashboardLogItem {
  ts: string | Date | number | null;
  type: string;     // module name (e.g., payments)
  module?: string;  // model key (e.g., payment)
  title?: string;
  status?: string;
  amount?: number;
  currency?: string;
  method?: string;
  refId: string;
  extra?: Record<string, any>;
}

export interface LogsResponse {
  events: DashboardLogItem[];
  limit: number;
  offset: number;
  totalMerged: number;
  sourceCounts: Record<string, number>;
  skipped: string[];
  errors: Record<string, string>;
  appliedFilters?: {
    include?: string[];
    exclude?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface LogsState {
  items: DashboardLogItem[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Overview */
export interface OverviewFinance {
  revenue: number;
  expenses: number;
  net: number;
}
export interface OverviewData {
  counters: Record<string, number>;
  finance: OverviewFinance;
  latest: { events: DashboardLogItem[]; limit: number } | { invoices?: any[]; payments?: any[]; jobs?: any[] };
}
export interface OverviewState {
  data: OverviewData | null;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Charts (v1 uyumluluk) */
export interface ChartsDataset {
  labels: string[];
  datasets: Array<{ label: string; data: number[]; yAxisID?: "y" | "y2" }>;
}
export interface ChartsState {
  data: ChartsDataset | null;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Stats (dinamik seriler) */
export interface StatsPoint { date: string; value: number; }
export interface StatsSeries { key: string; label: string; yAxisID?: "y" | "y2"; points: StatsPoint[]; }
export interface StatsData {
  groupBy: GroupBy;
  range: { from: string; to: string };
  labels: string[];
  series: StatsSeries[];
}
export interface StatsState {
  data: StatsData | null;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Report */
export interface ReportData {
  topUnpaid: Array<{ customerId?: string; customer?: any; total: number; count: number }>;
  latestInvoices: any[];
  latestPayments: any[];
  expenseBreakdown: Array<{ type: string; amount: number }>;
}
export interface ReportsState {
  data: ReportData | null;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}

/** Dashboard ALL */
export interface DashboardAllData {
  overview: OverviewData | null;
  stats: StatsData | null;
  latest: any; // backend 'latest' objesi
}
export interface DashboardAllState {
  data: DashboardAllData | null;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
}
