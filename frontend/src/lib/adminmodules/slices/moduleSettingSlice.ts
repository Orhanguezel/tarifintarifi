import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import { toast } from "react-toastify";
import type { IModuleSetting } from "../types";

// --- State ---
interface ModuleSettingState {
  tenantModules: IModuleSetting[];
  loading: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  successMessage: string | null;
}

const initialState: ModuleSettingState = {
  tenantModules: [],
  loading: false,
  status: "idle",
  error: null,
  successMessage: null,
};

// --- THUNKS ---

// 1) Header'daki tenant için tüm module settings
// GET /modules/setting
export const fetchTenantModuleSettings = createAsyncThunk<
  IModuleSetting[],
  void,
  { rejectValue: string }
>("moduleSetting/fetchTenantModules", async (_, thunkAPI) => {
  try {
    const res = await apiCall("get", "/modules/setting");
    return (res?.data as IModuleSetting[]) ?? [];
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Fetch failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 2) Tek module setting override
// PATCH /modules/setting   (body: { module, ...overrides })
export const updateModuleSetting = createAsyncThunk<
  IModuleSetting,
  Partial<IModuleSetting> & { module: string },
  { rejectValue: string }
>("moduleSetting/update", async (payload, thunkAPI) => {
  try {
    const res = await apiCall("patch", "/modules/setting", payload);
    return res?.data as IModuleSetting;
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Update failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 3) Tek mapping sil
// DELETE /modules/setting    (body: { module })
export const deleteModuleSetting = createAsyncThunk<
  unknown,
  { module: string },
  { rejectValue: string }
>("moduleSetting/delete", async (payload, thunkAPI) => {
  try {
    const res = await apiCall("delete", "/modules/setting", payload);
    return res?.data; // genelde undefined
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Delete failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 4) Header’daki tenant için TÜM mappingleri sil (cleanup)
// DELETE /modules/setting/tenant
export const deleteAllSettingsForTenant = createAsyncThunk<
  unknown,
  void,
  { rejectValue: string }
>("moduleSetting/deleteAllForTenant", async (_, thunkAPI) => {
  try {
    const res = await apiCall("delete", "/modules/setting/tenant");
    return res?.data; // genelde undefined
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Delete failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// --- SLICE ---
const moduleSettingSlice = createSlice({
  name: "moduleSetting",
  initialState,
  reducers: {
    clearModuleSettingMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // FETCH tenant modules
    builder.addCase(
      fetchTenantModuleSettings.fulfilled,
      (state, action: PayloadAction<IModuleSetting[]>) => {
        state.tenantModules = action.payload;
        state.loading = false;
        state.status = "succeeded";
      }
    );

    // UPDATE one
    builder.addCase(
      updateModuleSetting.fulfilled,
      (state, action: PayloadAction<IModuleSetting>) => {
        const updated = action.payload;
        const idx = state.tenantModules.findIndex(
          (m) => m.module === updated.module && m.tenant === updated.tenant
        );
        if (idx !== -1) state.tenantModules[idx] = updated;
        else state.tenantModules.push(updated);

        state.successMessage = "Tenant module setting updated.";
        state.loading = false;
        state.status = "succeeded";
        toast.success(state.successMessage);
      }
    );

    // DELETE one (aynı tenant context'inde, module'a göre düş)
    builder.addCase(deleteModuleSetting.fulfilled, (state, action) => {
      const { module } = action.meta.arg;
      state.tenantModules = state.tenantModules.filter((m) => m.module !== module);
      state.successMessage = "Tenant module setting deleted.";
      state.loading = false;
      state.status = "succeeded";
      toast.success(state.successMessage);
    });

    // DELETE all for tenant
    builder.addCase(deleteAllSettingsForTenant.fulfilled, (state) => {
      state.tenantModules = [];
      state.successMessage = "All tenant settings deleted.";
      state.loading = false;
      state.status = "succeeded";
      toast.success(state.successMessage);
    });

    // PENDING matcher
    builder.addMatcher(
      (action) =>
        action.type.startsWith("moduleSetting/") &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      }
    );

    // REJECTED matcher
    builder.addMatcher(
      (action) =>
        action.type.startsWith("moduleSetting/") &&
        action.type.endsWith("/rejected"),
      (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error =
          action.payload?.message || action.payload || "Operation failed!";
        toast.error(state.error);
      }
    );
  },
});

export const { clearModuleSettingMessages } = moduleSettingSlice.actions;
export default moduleSettingSlice.reducer;
