// src/modules/dashboard/slice/chartDataSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ChartsState, ChartsDataset, GroupBy, ApiEnvelope } from "../types";

export type ChartsParams = {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: GroupBy;
  include?: string;
};

export const fetchDashboardCharts = createAsyncThunk<
  ChartsDataset,
  ChartsParams | undefined,
  { rejectValue: { status: number | string; message: string } }
>("dashboard/charts", async (params, { rejectWithValue }) => {
  const query = {
    groupBy: params?.groupBy ?? "week",
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    include: params?.include,
  };
  const res = await apiCall("get", "/dashboard/charts", query, rejectWithValue);
  const env = (res?.data ?? res) as ApiEnvelope<ChartsDataset> | any;

  if (env?.success === false) {
    return rejectWithValue({ status: 400, message: env?.message || "Failed" });
  }
  return env?.data ?? env;
});

export const initialChartsState: ChartsState = {
  data: null,
  loading: false,
  error: null,
  successMessage: null,
};

const chartDataSlice = createSlice({
  name: "dashboardCharts",
  initialState: initialChartsState,
  reducers: {
    clearChartsError(state) {
      state.error = null;
    },
    resetCharts(state) {
      Object.assign(state, initialChartsState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.successMessage = "dashboard.charts.success";
      })
      .addCase(fetchDashboardCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "dashboard.charts.error";
      });
  },
});

export const { clearChartsError, resetCharts } = chartDataSlice.actions;

/* Selectors — güvenli (slice yoksa initialChartsState döner) */
export const selectCharts = (s: any): ChartsState =>
  (s && s.dashboardCharts) ? (s.dashboardCharts as ChartsState) : initialChartsState;

export const selectChartsData = (s: any) =>
  selectCharts(s).data;

export const selectChartsLoading = (s: any) =>
  Boolean(selectCharts(s).loading);

export default chartDataSlice.reducer;
