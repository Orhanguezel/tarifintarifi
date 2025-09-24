import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { DashboardAllData, DashboardAllState, GroupBy, RangeParams, ApiEnvelope } from "../types";

export type FetchAllParams = RangeParams & {
  include?: string; // "overview,stats,latest"
  groupBy?: GroupBy;
  latestLimit?: number;
};

export const fetchDashboardAll = createAsyncThunk<
  DashboardAllData,
  FetchAllParams | undefined,
  { rejectValue: { status: number | string; message: string } }
>("dashboard/fetchAll", async (params, { rejectWithValue }) => {
  const query = {
    include: params?.include ?? "overview,stats,latest",
    groupBy: params?.groupBy ?? "week",
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    latestLimit: params?.latestLimit ?? 10,
  };
  const res = await apiCall("get", "/dashboard", query, rejectWithValue);
  const env = (res?.data ?? res) as ApiEnvelope<DashboardAllData> | any;

  if (env?.success === false) {
    return rejectWithValue({ status: 400, message: env?.message || "Failed" });
  }
  return env?.data ?? env;
});

const initialState: DashboardAllState = {
  data: null,
  loading: false,
  error: null,
  successMessage: null,
};

const dashboardSlice = createSlice({
  name: "dashboardAll",
  initialState,
  reducers: {
    clearDashboardAllError(state) {
      state.error = null;
    },
    resetDashboardAll(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardAll.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchDashboardAll.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.successMessage = "dashboard.all.success";
      })
      .addCase(fetchDashboardAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "dashboard.all.error";
      });
  },
});

export const { clearDashboardAllError, resetDashboardAll } = dashboardSlice.actions;

/* Selectors */
export const selectDashboardAll = (s: any) => s.dashboardAll as DashboardAllState;
export const selectDashboardAllData = (s: any) => (s.dashboardAll as DashboardAllState).data;
export const selectDashboardAllLoading = (s: any) => (s.dashboardAll as DashboardAllState).loading;

export default dashboardSlice.reducer;
