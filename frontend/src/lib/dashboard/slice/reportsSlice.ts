import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ReportsState, ReportData, ApiEnvelope } from "../types";

export type ReportParams = {
  dateFrom?: string;
  dateTo?: string;
  include?: string; // "invoicing,payments,expenses"
  limit?: number;
  offset?: number;
};

export const fetchDashboardReport = createAsyncThunk<
  ReportData,
  ReportParams | undefined,
  { rejectValue: { status: number | string; message: string } }
>("dashboard/report", async (params, { rejectWithValue }) => {
  const query = {
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    include: params?.include ?? "invoicing,payments,expenses",
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
  };
  const res = await apiCall("get", "/dashboard/report", query, rejectWithValue);
  const env = (res?.data ?? res) as ApiEnvelope<ReportData> | any;
  if (env?.success === false) {
    return rejectWithValue({ status: 400, message: env?.message || "Failed" });
  }
  return env?.data ?? env;
});

const initialState: ReportsState = {
  data: null,
  loading: false,
  error: null,
  successMessage: null,
};

const reportsSlice = createSlice({
  name: "dashboardReport",
  initialState,
  reducers: {
    clearReportError(state) {
      state.error = null;
    },
    resetReport(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchDashboardReport.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.successMessage = "dashboard.report.success";
      })
      .addCase(fetchDashboardReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "dashboard.report.error";
      });
  },
});

export const { clearReportError, resetReport } = reportsSlice.actions;

/* Selectors */
export const selectReport = (s: any) => s.dashboardReport as ReportsState;
export const selectReportData = (s: any) => (s.dashboardReport as ReportsState).data;
export const selectReportLoading = (s: any) => (s.dashboardReport as ReportsState).loading;

export default reportsSlice.reducer;
