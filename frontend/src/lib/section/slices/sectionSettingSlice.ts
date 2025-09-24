import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ISectionSetting } from "@/modules/section/types";

// STATE
interface SectionSettingState {
  settings: ISectionSetting[];
  settingsAdmin: ISectionSetting[];
  loading: boolean;
  loadingAdmin: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  successMessage: string | null;
}

const initialState: SectionSettingState = {
  settings: [],
  settingsAdmin: [],
  loading: false,
  loadingAdmin: false,
  status: "idle",
  error: null,
  successMessage: null,
};

function extractMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && payload && "message" in payload && typeof (payload as any).message === "string") {
    return (payload as any).message;
  }
  return null;
}

// 1️⃣ Tenant için tüm section ayarlarını getir (header’dan tenant otomatik)
export const fetchSectionSettingsByTenant = createAsyncThunk<ISectionSetting[], void>(
  "sectionSetting/fetchByTenant",
  async (_, thunkAPI) => {
    const res = await apiCall("get", `/section/setting`, null, thunkAPI.rejectWithValue);
    return res.data;
  }
);

// 2️⃣ Admin: Tüm tenantlardan tüm ayarları getir
export const fetchSectionSettingsAdmin = createAsyncThunk<ISectionSetting[], void>(
  "sectionSetting/fetchAdmin",
  async (_, thunkAPI) => {
    const res = await apiCall("get", `/section/setting/admin`, null, thunkAPI.rejectWithValue);
    return res.data;
  }
);

// 3️⃣ Section ayarı oluştur
export const createSectionSetting = createAsyncThunk<
  { data: ISectionSetting; message?: string },
  Partial<ISectionSetting>
>(
  "sectionSetting/create",
  async (data, thunkAPI) => {
    const res = await apiCall("post", "/section/setting", data, thunkAPI.rejectWithValue);
    return { data: res.data, message: res.message };
  }
);

// 4️⃣ Section ayarını güncelle
export const updateSectionSetting = createAsyncThunk<
  { data: ISectionSetting; message?: string },
  { sectionKey: string; data: Partial<ISectionSetting> }
>(
  "sectionSetting/update",
  async ({ sectionKey, data }, thunkAPI) => {
    const res = await apiCall("put", `/section/setting/${sectionKey}`, data, thunkAPI.rejectWithValue);
    return { data: res.data, message: res.message };
  }
);

// 5️⃣ Section ayarını sil
export const deleteSectionSetting = createAsyncThunk<
  { sectionKey: string; message?: string },
  { sectionKey: string }
>(
  "sectionSetting/delete",
  async ({ sectionKey }, thunkAPI) => {
    const res = await apiCall("delete", `/section/setting/${sectionKey}`, null, thunkAPI.rejectWithValue);
    return { sectionKey, message: res.message };
  }
);

const sectionSettingSlice = createSlice({
  name: "sectionSetting",
  initialState,
  reducers: {
    clearSectionSettingMessages(state) {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Tenant settings
      .addCase(fetchSectionSettingsByTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionSettingsByTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSectionSettingsByTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = extractMessage(action.payload);
      })

      // Admin settings
      .addCase(fetchSectionSettingsAdmin.pending, (state) => {
        state.loadingAdmin = true;
        state.error = null;
      })
      .addCase(fetchSectionSettingsAdmin.fulfilled, (state, action) => {
        state.loadingAdmin = false;
        state.settingsAdmin = action.payload;
      })
      .addCase(fetchSectionSettingsAdmin.rejected, (state, action) => {
        state.loadingAdmin = false;
        state.error = extractMessage(action.payload);
      })

      // CRUD
      .addCase(createSectionSetting.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.settings.push(action.payload.data);
          state.settingsAdmin.push(action.payload.data);
        }
        state.successMessage = action.payload?.message ?? null;
      })
      .addCase(updateSectionSetting.fulfilled, (state, action) => {
        if (action.payload?.data) {
          const idx = state.settings.findIndex(
            (s) => s.sectionKey === action.payload.data.sectionKey
          );
          if (idx !== -1) state.settings[idx] = action.payload.data;
          const idxAdmin = state.settingsAdmin.findIndex(
            (s) => s.sectionKey === action.payload.data.sectionKey
          );
          if (idxAdmin !== -1) state.settingsAdmin[idxAdmin] = action.payload.data;
        }
        state.successMessage = action.payload?.message ?? null;
      })
      .addCase(deleteSectionSetting.fulfilled, (state, action) => {
        state.settings = state.settings.filter(
          (s) => s.sectionKey !== action.payload.sectionKey
        );
        state.settingsAdmin = state.settingsAdmin.filter(
          (s) => s.sectionKey !== action.payload.sectionKey
        );
        state.successMessage = action.payload?.message ?? null;
      });
  },
});

export const { clearSectionSettingMessages } = sectionSettingSlice.actions;
export default sectionSettingSlice.reducer;
