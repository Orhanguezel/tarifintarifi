// src/modules/dashboard/slice/logsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { LogsResponse, LogsState, ApiEnvelope } from "../types";

export type LogsParams = {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  include?: string; // "payments,expenses"
  exclude?: string;
  append?: boolean; // yeni: önceki listeye ekle (sonsuz kaydırma)
};

// basit dedup helper (refId+type)
const dedupe = <T extends { refId?: string; type?: string }>(arr: T[]) => {
  const map = new Map<string, T>();
  for (const it of arr) {
    const key = `${it.type ?? ""}:${it.refId ?? ""}`;
    if (!map.has(key)) map.set(key, it);
  }
  return Array.from(map.values());
};

export const fetchDashboardLogs = createAsyncThunk<
  LogsResponse,
  LogsParams | undefined,
  { rejectValue: { status: number | string; message: string } }
>("dashboard/logs", async (params, { rejectWithValue }) => {
  const query = {
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    include: params?.include,
    exclude: params?.exclude,
  };
  const res = await apiCall("get", "/dashboard/logs", query, rejectWithValue);
  const env = (res?.data ?? res) as ApiEnvelope<LogsResponse> | any;

  if (env?.success === false) {
    return rejectWithValue({ status: 400, message: env?.message || "Failed" });
  }
  return env?.data ?? env;
});

export const initialLogsState: LogsState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  loading: false,
  error: null,
  successMessage: null,
};

const logsSlice = createSlice({
  name: "dashboardLogs",
  initialState: initialLogsState,
  reducers: {
    clearLogsError(state) {
      state.error = null;
    },
    resetLogs(state) {
      Object.assign(state, initialLogsState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        // append modunda beklerken mevcut listeyi koru (silme yok)
        // replace modunda da koruyoruz; FE isterse resetLogs çağırabilir
      })
      .addCase(fetchDashboardLogs.fulfilled, (state, action) => {
        state.loading = false;

        const payload = action.payload;
        const incoming = payload.events ?? [];
        const isAppend = !!(action.meta.arg && action.meta.arg.append);

        if (isAppend) {
          state.items = dedupe([...(state.items || []), ...incoming]);
        } else {
          state.items = incoming;
        }

        state.total = payload.totalMerged ?? state.items.length;
        state.limit = payload.limit ?? action.meta.arg?.limit ?? state.limit ?? 20;
        state.offset = payload.offset ?? action.meta.arg?.offset ?? 0;
        state.successMessage = "dashboard.logs.success";
      })
      .addCase(fetchDashboardLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "dashboard.logs.error";
      });
  },
});

export const { clearLogsError, resetLogs } = logsSlice.actions;

/* Selectors */
export const selectDashboardLogs = (s: any): LogsState =>
  (s && s.dashboardLogs) ? (s.dashboardLogs as LogsState) : initialLogsState;

export const selectDashboardLogsItems = (s: any) =>
  (s && s.dashboardLogs && s.dashboardLogs.items) ?? initialLogsState.items;

export const selectDashboardLogsLoading = (s: any) =>
  Boolean(s?.dashboardLogs?.loading ?? initialLogsState.loading);

export const selectDashboardLogsTotal = (s: any) =>
  (s?.dashboardLogs?.total ?? initialLogsState.total);

export default logsSlice.reducer;
