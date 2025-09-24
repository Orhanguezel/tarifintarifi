import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import { toast } from "react-toastify";

// ---- TYPES (backend ile hizalı) ----
export type ModuleTenantMatrix = Record<string, Record<string, boolean>>;

interface MaintenanceLog {
  [key: string]: any;
}
interface OrphanRecord {
  [key: string]: any;
}

interface CleanupResult {
  deletedCount: number;
  orphans: OrphanRecord[];
}

interface BatchUpdateResult {
  modifiedCount: number;
  message?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  deletedCount?: number;
  modifiedCount?: number;
  repaired?: any[];
  orphans?: OrphanRecord[];
  [key: string]: any;
}

interface ModuleMaintenanceState {
  moduleTenantMatrix: ModuleTenantMatrix;
  maintenanceLogs: MaintenanceLog[];
  repaired: any[];
  deletedCount: number;
  orphans: OrphanRecord[];
  maintenanceLoading: boolean;
  maintenanceError: string | null;
  successMessage: string | null;
  lastAction: string;
}

const initialState: ModuleMaintenanceState = {
  moduleTenantMatrix: {},
  maintenanceLogs: [],
  repaired: [],
  deletedCount: 0,
  orphans: [],
  maintenanceLoading: false,
  maintenanceError: null,
  successMessage: null,
  lastAction: "",
};

// ---- ASYNC THUNKS ----

// 1) Tüm modül-tenant matrixini getir
export const fetchModuleTenantMatrix = createAsyncThunk<
  ApiResponse<ModuleTenantMatrix>,
  void,
  { rejectValue: string }
>("moduleMaintenance/fetchModuleTenantMatrix", async (_, thunkAPI) => {
  try {
    const res = await apiCall("get", "/modules/maintenance/matrix");
    return res as ApiResponse<ModuleTenantMatrix>;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Fetch failed");
  }
});

// 2) Tek tenant’a tüm modülleri ata
export const assignAllModulesToTenant = createAsyncThunk<
  ApiResponse<MaintenanceLog>,
  string,
  { rejectValue: string }
>("moduleMaintenance/assignAllModulesToTenant", async (tenant, thunkAPI) => {
  try {
    const res = await apiCall("post", "/modules/maintenance/batch-assign", { tenant });
    const payload = res as ApiResponse<MaintenanceLog>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Assign failed");
  }
});

// 3) Bir modülü tüm tenantlara ata
export const assignModuleToAllTenants = createAsyncThunk<
  ApiResponse<MaintenanceLog>,
  string,
  { rejectValue: string }
>("moduleMaintenance/assignModuleToAllTenants", async (module, thunkAPI) => {
  try {
    const res = await apiCall("post", "/modules/maintenance/global-assign", { module });
    const payload = res as ApiResponse<MaintenanceLog>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Assign failed");
  }
});

// 4) Eksik mappingleri onar
export const repairModuleSettings = createAsyncThunk<
  ApiResponse<any[]>,
  void,
  { rejectValue: string }
>("moduleMaintenance/repairModuleSettings", async (_, thunkAPI) => {
  try {
    const res = await apiCall("post", "/modules/maintenance/repair-settings");
    const payload = res as ApiResponse<any[]>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Repair failed");
  }
});

// 5) Bir tenant’ın tüm mappinglerini sil
export const removeAllModulesFromTenant = createAsyncThunk<
  ApiResponse<unknown>,
  string,
  { rejectValue: string }
>("moduleMaintenance/removeAllModulesFromTenant", async (tenant, thunkAPI) => {
  try {
    const res = await apiCall("delete", "/modules/maintenance/tenant-cleanup", { tenant });
    const payload = res as ApiResponse<unknown>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Cleanup failed");
  }
});

// 6) Bir modülü tüm tenantlardan sil
export const removeModuleFromAllTenants = createAsyncThunk<
  ApiResponse<unknown>,
  string,
  { rejectValue: string }
>("moduleMaintenance/removeModuleFromAllTenants", async (module, thunkAPI) => {
  try {
    const res = await apiCall("delete", "/modules/maintenance/global-cleanup", { module });
    const payload = res as ApiResponse<unknown>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Global cleanup failed");
  }
});

// 7) Orphan settings temizliği
export const cleanupOrphanModuleSettings = createAsyncThunk<
  ApiResponse<CleanupResult>,
  void,
  { rejectValue: string }
>("moduleMaintenance/cleanupOrphanModuleSettings", async (_, thunkAPI) => {
  try {
    const res = await apiCall("delete", "/modules/maintenance/cleanup-orphan");
    const payload = res as ApiResponse<CleanupResult>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Cleanup failed");
  }
});

// 8) Batch update (tüm tenantlarda)
export const batchUpdateModuleSetting = createAsyncThunk<
  ApiResponse<BatchUpdateResult>,
  { module: string; update: any },
  { rejectValue: string }
>("moduleMaintenance/batchUpdateModuleSetting", async ({ module, update }, thunkAPI) => {
  try {
    const res = await apiCall("patch", "/modules/maintenance/batch-update", { module, update });
    const payload = res as ApiResponse<BatchUpdateResult>;
    if (payload?.message) toast.success(payload.message);
    return payload;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Batch update failed");
  }
});

// ---- SLICE ----
const moduleMaintenanceSlice = createSlice({
  name: "moduleMaintenance",
  initialState,
  reducers: {
    clearMaintenanceState: (state) => {
      state.maintenanceError = null;
      state.maintenanceLogs = [];
      state.repaired = [];
      state.deletedCount = 0;
      state.orphans = [];
      state.successMessage = null;
      state.lastAction = "";
    },
    clearModuleMaintenanceMessages: (state) => {
      state.maintenanceError = null;
      state.successMessage = null;
      state.lastAction = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // MATRIX
      .addCase(
        fetchModuleTenantMatrix.fulfilled,
        (state, action: PayloadAction<ApiResponse<ModuleTenantMatrix>>) => {
          state.moduleTenantMatrix = action.payload?.data || {};
          state.successMessage = action.payload?.message || null;
          state.maintenanceLoading = false;
        }
      )
      // ASSIGN (tenant)
      .addCase(
        assignAllModulesToTenant.fulfilled,
        (state, action: PayloadAction<ApiResponse<MaintenanceLog>>) => {
          state.maintenanceLogs = [action.payload?.data ?? action.payload ?? {}];
          state.successMessage =
            action.payload?.message ?? "All modules assigned to tenant.";
          state.maintenanceLoading = false;
        }
      )
      // ASSIGN (global)
      .addCase(
        assignModuleToAllTenants.fulfilled,
        (state, action: PayloadAction<ApiResponse<MaintenanceLog>>) => {
          state.maintenanceLogs = [action.payload?.data ?? action.payload ?? {}];
          state.successMessage =
            action.payload?.message ?? "Module assigned to all tenants.";
          state.maintenanceLoading = false;
        }
      )
      // REPAIR
      .addCase(
        repairModuleSettings.fulfilled,
        (state, action: PayloadAction<ApiResponse<any[]>>) => {
          state.repaired =
            action.payload?.repaired ??
            action.payload?.data ??
            [];
          state.successMessage =
            action.payload?.message ?? "Missing settings repaired.";
          state.maintenanceLoading = false;
        }
      )
      // TENANT CLEANUP
      .addCase(
        removeAllModulesFromTenant.fulfilled,
        (state, action: PayloadAction<ApiResponse<unknown>>) => {
          state.deletedCount = action.payload?.deletedCount ?? 0;
          state.successMessage =
            action.payload?.message ?? "All module mappings for tenant removed.";
          state.maintenanceLoading = false;
        }
      )
      // GLOBAL CLEANUP
      .addCase(
        removeModuleFromAllTenants.fulfilled,
        (state, action: PayloadAction<ApiResponse<unknown>>) => {
          state.deletedCount = action.payload?.deletedCount ?? 0;
          state.successMessage =
            action.payload?.message ?? "Module removed from all tenants.";
          state.maintenanceLoading = false;
        }
      )
      // ORPHAN CLEANUP
      .addCase(
        cleanupOrphanModuleSettings.fulfilled,
        (state, action: PayloadAction<ApiResponse<CleanupResult>>) => {
          state.deletedCount = action.payload?.deletedCount ?? 0;
          state.orphans = action.payload?.orphans ?? [];
          state.successMessage =
            action.payload?.message ?? "Orphan module settings cleaned up.";
          state.maintenanceLoading = false;
        }
      )
      // BATCH UPDATE
      .addCase(
        batchUpdateModuleSetting.fulfilled,
        (state, action: PayloadAction<ApiResponse<BatchUpdateResult>>) => {
          state.maintenanceLogs = [action.payload?.data ?? action.payload ?? {}];
          state.successMessage =
            action.payload?.message ?? "Batch module update completed.";
          state.maintenanceLoading = false;
        }
      )
      // PENDING
      .addMatcher(
        (action) =>
          action.type.startsWith("moduleMaintenance/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.maintenanceLoading = true;
          state.maintenanceError = null;
          state.successMessage = null;
        }
      )
      // REJECTED
      .addMatcher(
        (action) =>
          action.type.startsWith("moduleMaintenance/") &&
          action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.maintenanceLoading = false;
          state.maintenanceError =
            action.payload?.message || action.payload || "Operation failed.";
          toast.error(state.maintenanceError || "Operation failed.");
        }
      );
  },
});

export const { clearMaintenanceState, clearModuleMaintenanceMessages } =
  moduleMaintenanceSlice.actions;
export default moduleMaintenanceSlice.reducer;
