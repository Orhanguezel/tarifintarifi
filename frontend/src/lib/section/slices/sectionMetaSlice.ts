import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ISectionMeta } from "@/modules/section/types";

// STATE
interface SectionMetaState {
  metas: ISectionMeta[];
  metasAdmin: ISectionMeta[];
  loading: boolean;
  loadingAdmin: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  successMessage: string | null;
}

const initialState: SectionMetaState = {
  metas: [],
  metasAdmin: [],
  loading: false,
  loadingAdmin: false,
  status: "idle",
  error: null,
  successMessage: null,
};

// --- Helper: Payload'dan error message çekmek (type-safe) ---
function extractMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && "message" in payload && typeof (payload as any).message === "string") {
    return (payload as any).message;
  }
  return null;
}

// ASYNC THUNKS

// Public fetch
export const fetchSectionMetas = createAsyncThunk<ISectionMeta[]>(
  "sectionMeta/fetchAll",
  async (_, thunkAPI) => {
    const res = await apiCall("get", "/section/meta", null, thunkAPI.rejectWithValue);
    return res.data;
  }
);

// Admin fetch
export const fetchSectionMetasAdmin = createAsyncThunk<ISectionMeta[]>(
  "sectionMeta/fetchAllAdmin",
  async (_, thunkAPI) => {
    const res = await apiCall("get", "/section/meta/admin", null, thunkAPI.rejectWithValue);
    return res.data;
  }
);

// Create
export const createSectionMeta = createAsyncThunk<{ data: ISectionMeta; message?: string }, Partial<ISectionMeta>>(
  "sectionMeta/create",
  async (data, thunkAPI) => {
    const res = await apiCall("post", "/section/meta", data, thunkAPI.rejectWithValue);
    return { data: res.data, message: res.message };
  }
);

// Update
export const updateSectionMeta = createAsyncThunk<{ data: ISectionMeta; message?: string }, { sectionKey: string; data: Partial<ISectionMeta> }>(
  "sectionMeta/update",
  async ({ sectionKey, data }, thunkAPI) => {
    const res = await apiCall("put", `/section/meta/${sectionKey}`, data, thunkAPI.rejectWithValue);
    return { data: res.data, message: res.message };
  }
);

// Delete
export const deleteSectionMeta = createAsyncThunk<{ sectionKey: string; message?: string }, string>(
  "sectionMeta/delete",
  async (sectionKey, thunkAPI) => {
    const res = await apiCall("delete", `/section/meta/${sectionKey}`, null, thunkAPI.rejectWithValue);
    return { sectionKey, message: res.message };
  }
);

// SLICE

const sectionMetaSlice = createSlice({
  name: "sectionMeta",
  initialState,
  reducers: {
    clearSectionMetaMessages(state) {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // PUBLIC
    builder
      .addCase(fetchSectionMetas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionMetas.fulfilled, (state, action) => {
        state.loading = false;
        state.metas = action.payload;
      })
      .addCase(fetchSectionMetas.rejected, (state, action) => {
        state.loading = false;
        state.error = extractMessage(action.payload);
      })
    // ADMIN
      .addCase(fetchSectionMetasAdmin.pending, (state) => {
        state.loadingAdmin = true;
        state.error = null;
      })
      .addCase(fetchSectionMetasAdmin.fulfilled, (state, action) => {
        state.loadingAdmin = false;
        state.metasAdmin = action.payload;
      })
      .addCase(fetchSectionMetasAdmin.rejected, (state, action) => {
        state.loadingAdmin = false;
        state.error = extractMessage(action.payload);
      })
    // CRUD
      .addCase(createSectionMeta.fulfilled, (state, action) => {
        state.metas.push(action.payload.data);
        state.metasAdmin.push(action.payload.data);
        state.successMessage = action.payload.message ?? null;
      })
      .addCase(updateSectionMeta.fulfilled, (state, action) => {
        const idx = state.metas.findIndex((m) => m.sectionKey === action.payload.data.sectionKey);
        if (idx !== -1) state.metas[idx] = action.payload.data;
        const idxAdmin = state.metasAdmin.findIndex((m) => m.sectionKey === action.payload.data.sectionKey);
        if (idxAdmin !== -1) state.metasAdmin[idxAdmin] = action.payload.data;
        state.successMessage = action.payload.message ?? null;
      })
      .addCase(deleteSectionMeta.fulfilled, (state, action) => {
        state.metas = state.metas.filter((m) => m.sectionKey !== action.payload.sectionKey);
        state.metasAdmin = state.metasAdmin.filter((m) => m.sectionKey !== action.payload.sectionKey);
        state.successMessage = action.payload.message ?? null;
      });
  },
});

export const { clearSectionMetaMessages } = sectionMetaSlice.actions;
export default sectionMetaSlice.reducer;
