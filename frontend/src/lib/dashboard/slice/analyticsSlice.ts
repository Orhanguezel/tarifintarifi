// src/modules/dashboard/store/analytics.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { AnalyticsEvent, AnalyticsState, ApiEnvelope } from "../types";

/* ---------- Param tipleri (UI -> state) ---------- */
export type AnalyticsListParams = {
  limit?: number;
  skip?: number;        // backend
  offset?: number;      // UI legacy -> skip'e çevrilecek
  startDate?: string;   // backend
  endDate?: string;     // backend
  dateFrom?: string;    // UI legacy -> startDate
  dateTo?: string;      // UI legacy -> endDate
  module?: string;
  eventType?: string;
  sort?: string;
  fields?: string;      // "field1,field2"
  project?: string;
  nearLat?: number;
  nearLon?: number;
  nearDistance?: number;
};

export type AnalyticsTrendsParams = {
  module?: string;
  eventType?: string;
  period?: "day" | "month";
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  country?: string;
  city?: string;
  project?: string;
};

/* ---------- Query builder’lar ---------- */
function buildEventsQuery(p?: AnalyticsListParams) {
  const q: Record<string, any> = {};
  if (!p) return q;

  if (p.limit != null) q.limit = p.limit;

  // offset -> skip
  if (p.skip != null) q.skip = p.skip;
  else if (p.offset != null) q.skip = p.offset;

  // dateFrom/dateTo -> startDate/endDate
  const startDate = p.startDate ?? p.dateFrom;
  const endDate   = p.endDate   ?? p.dateTo;
  if (startDate) q.startDate = startDate;
  if (endDate)   q.endDate   = endDate;

  if (p.module)        q.module = p.module;
  if (p.eventType)     q.eventType = p.eventType;
  if (p.sort)          q.sort = p.sort;
  if (p.fields)        q.fields = p.fields;
  if (p.project)       q.project = p.project;
  if (p.nearLat != null)      q.nearLat = p.nearLat;
  if (p.nearLon != null)      q.nearLon = p.nearLon;
  if (p.nearDistance != null) q.nearDistance = p.nearDistance;

  return q;
}

function buildTrendsQuery(p?: AnalyticsTrendsParams) {
  const q: Record<string, any> = {};
  if (!p) return q;

  if (p.module)    q.module = p.module;
  if (p.eventType) q.eventType = p.eventType;
  if (p.period)    q.period = p.period;

  const startDate = p.startDate ?? p.dateFrom;
  const endDate   = p.endDate   ?? p.dateTo;
  if (startDate) q.startDate = startDate;
  if (endDate)   q.endDate   = endDate;

  if (p.country) q.country = p.country;
  if (p.city)    q.city = p.city;
  if (p.project) q.project = p.project;

  return q;
}

/* ---------- Envelope normalizasyonu ---------- */
function normalizeEventsEnvelope(raw: any): { events: AnalyticsEvent[]; count: number; message?: string } {
  const env = (raw?.data ?? raw) as ApiEnvelope<any> | any;

  if (env?.success === false) {
    throw new Error(env?.message || "Failed");
  }
  // { success, count, data: [ ... ] }
  if (Array.isArray(env?.data)) {
    const events = env.data as AnalyticsEvent[];
    const count = Number.isFinite(env?.count) ? env.count : events.length;
    return { events, count, message: env?.message };
  }
  // { success, data: { events, count? } }
  if (env?.data && Array.isArray(env?.data?.events)) {
    const events = env.data.events as AnalyticsEvent[];
    const count =
      Number.isFinite(env?.data?.count) ? env.data.count :
      (Number.isFinite(env?.count) ? env.count : events.length);
    return { events, count, message: env?.message };
  }
  // { events, count }
  if (Array.isArray(env?.events)) {
    const events = env.events as AnalyticsEvent[];
    const count = Number.isFinite(env?.count) ? env.count : events.length;
    return { events, count, message: env?.message };
  }
  return { events: [], count: 0, message: env?.message };
}

/* ---------- Thunks: parametresiz ---------- */
export const fetchAnalyticsEvents = createAsyncThunk<
  { events: AnalyticsEvent[]; count: number; message?: string },
  void,
  { rejectValue: { status: number | string; message: string } }
>("analytics/fetchList", async (_: void, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const q = buildEventsQuery(state?.analytics?.listQuery);
    const res = await apiCall("get", "/analytics/events", q, rejectWithValue);
    const normalized = normalizeEventsEnvelope(res?.data ?? res);
    return normalized;
  } catch (err: any) {
    return rejectWithValue({ status: err?.status || 400, message: err?.message || "Fetch analytics failed" });
  }
});

export const fetchAnalyticsTrends = createAsyncThunk<
  { trends: any[]; period: "day" | "month"; message?: string },
  void,
  { rejectValue: { status: number | string; message: string } }
>("analytics/fetchTrends", async (_: void, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const q = buildTrendsQuery(state?.analytics?.trendsQuery);
    const res = await apiCall("get", "/analytics/trends", q, rejectWithValue);
    const raw = res?.data ?? res;

    if (raw?.success === false) {
      return rejectWithValue({ status: 400, message: raw?.message || "Failed" });
    }
    const trends = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.trends) ? raw.trends : []);
    const period = (raw?.period === "month" ? "month" : "day") as "day" | "month";
    return { trends, period, message: raw?.message };
  } catch (err: any) {
    return rejectWithValue({ status: err?.status || 400, message: err?.message || "Fetch trends failed" });
  }
});

/* ---------- State ---------- */
const initialState: AnalyticsState & {
  listQuery?: AnalyticsListParams;
  trendsQuery?: AnalyticsTrendsParams;
} = {
  events: [],
  count: 0,
  trends: [],
  loading: false,
  error: null,
  successMessage: null,
  listQuery: undefined,
  trendsQuery: { period: "day" },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError(state) {
      state.error = null;
    },
    resetAnalytics(state) {
      state.events = [];
      state.count = 0;
      state.trends = [];
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      state.listQuery = undefined;
      state.trendsQuery = { period: "day" };
    },

    // 🔧 Parametresiz thunk’lar için query setter’lar
    setEventsQuery(state, action: PayloadAction<Partial<AnalyticsListParams> | undefined>) {
      state.listQuery = { ...(state.listQuery || {}), ...(action.payload || {}) };
    },
    clearEventsQuery(state) {
      state.listQuery = undefined;
    },
    setTrendsQuery(state, action: PayloadAction<Partial<AnalyticsTrendsParams> | undefined>) {
      state.trendsQuery = { ...(state.trendsQuery || {}), ...(action.payload || {}) };
    },
    clearTrendsQuery(state) {
      state.trendsQuery = { period: "day" };
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchAnalyticsEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchAnalyticsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.count = action.payload.count;
        state.successMessage = action.payload.message ?? "OK";
      })
      .addCase(fetchAnalyticsEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Fetch analytics failed";
      })
      // trends
      .addCase(fetchAnalyticsTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchAnalyticsTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.trends = action.payload.trends;
        state.successMessage = action.payload.message ?? "OK";
      })
      .addCase(fetchAnalyticsTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Fetch trends failed";
      });
  },
});

export const {
  clearAnalyticsError,
  resetAnalytics,
  setEventsQuery,
  clearEventsQuery,
  setTrendsQuery,
  clearTrendsQuery,
} = analyticsSlice.actions;

/* ---------- Selectors ---------- */
export const selectAnalytics       = (s: any) => s.analytics as AnalyticsState;
export const selectAnalyticsEvents = (s: any) => (s.analytics as AnalyticsState).events;
export const selectAnalyticsCount  = (s: any) => (s.analytics as AnalyticsState).count;
export const selectAnalyticsTrends = (s: any) => (s.analytics as AnalyticsState).trends;
export const selectAnalyticsLoading= (s: any) => (s.analytics as AnalyticsState).loading;
export const selectAnalyticsError  = (s: any) => (s.analytics as AnalyticsState).error;
// query’ler
export const selectEventsQuery     = (s: any) => s.analytics?.listQuery as AnalyticsListParams | undefined;
export const selectTrendsQuery     = (s: any) => s.analytics?.trendsQuery as AnalyticsTrendsParams | undefined;

export default analyticsSlice.reducer;
