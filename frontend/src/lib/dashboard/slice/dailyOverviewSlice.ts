// src/modules/dashboard/slice/dailyOverviewSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { OverviewState, OverviewData, ApiEnvelope } from "../types";

export type OverviewParams = {
  dateFrom?: string;
  dateTo?: string;
  latestLimit?: number;
};

export const fetchDashboardOverview = createAsyncThunk<
  OverviewData,
  OverviewParams | undefined,
  { rejectValue: { status: number | string; message: string } }
>("dashboard/overview", async (params, { rejectWithValue }) => {
  const query = {
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    latestLimit: params?.latestLimit ?? 10,
  };
  const res = await apiCall("get", "/dashboard/overview", query, rejectWithValue);
  const env = (res?.data ?? res) as ApiEnvelope<OverviewData> | any;

  if (env?.success === false) {
    return rejectWithValue({ status: 400, message: env?.message || "Failed" });
  }
  return env?.data ?? env;
});

export const initialOverviewState: OverviewState = {
  data: null,
  loading: false,
  error: null,
  successMessage: null,
};

const dailyOverviewSlice = createSlice({
  name: "dashboardOverview",
  initialState: initialOverviewState,
  reducers: {
    clearOverviewError(state) {
      state.error = null;
    },
    resetOverview(state) {
      Object.assign(state, initialOverviewState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.successMessage = "dashboard.overview.success";
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "dashboard.overview.error";
      });
  },
});

export const { clearOverviewError, resetOverview } = dailyOverviewSlice.actions;

/* Selectors — güvenli (slice yoksa initialOverviewState döner) */
export const selectOverview = (s: any): OverviewState =>
  (s && s.dashboardOverview) ? (s.dashboardOverview as OverviewState) : initialOverviewState;

export const selectOverviewData = (s: any) =>
  selectOverview(s).data;

export const selectOverviewLoading = (s: any) =>
  Boolean(selectOverview(s).loading);

export default dailyOverviewSlice.reducer;
