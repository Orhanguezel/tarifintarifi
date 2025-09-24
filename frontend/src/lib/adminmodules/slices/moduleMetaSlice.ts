import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import { toast } from "react-toastify";
import type { IModuleMeta } from "../types";

// --- STATE ---
interface ModuleMetaState {
  modules: IModuleMeta[];
  selectedModule: IModuleMeta | null;
  loading: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  successMessage: string | null;
}

const initialState: ModuleMetaState = {
  modules: [],
  selectedModule: null,
  loading: false,
  status: "idle",
  error: null,
  successMessage: null,
};

// --- ASYNC THUNKS ---

// 1) CREATE
export const createModuleMeta = createAsyncThunk<
  IModuleMeta,
  Partial<IModuleMeta>,
  { rejectValue: string }
>("moduleMeta/create", async (payload, thunkAPI) => {
  try {
    const res = await apiCall("post", "/modules/meta", payload);
    // backend: { success, data }
    return res?.data as IModuleMeta;
  } catch (err: any) {
    const msg =
      err?.data?.message || err?.message || "Module creation failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 2) FETCH ALL
export const fetchModuleMetas = createAsyncThunk<
  IModuleMeta[],
  void,
  { rejectValue: string }
>("moduleMeta/fetchAll", async (_, thunkAPI) => {
  try {
    const res = await apiCall("get", "/modules/meta");
    return (res?.data as IModuleMeta[]) ?? [];
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Fetch failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 3) FETCH BY NAME
export const fetchModuleMetaByName = createAsyncThunk<
  IModuleMeta,
  string,
  { rejectValue: string }
>("moduleMeta/fetchByName", async (name, thunkAPI) => {
  try {
    const res = await apiCall("get", `/modules/meta/${encodeURIComponent(name)}`);
    return res?.data as IModuleMeta;
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Fetch failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 4) UPDATE
export const updateModuleMeta = createAsyncThunk<
  IModuleMeta,
  { name: string; updates: Partial<IModuleMeta> },
  { rejectValue: string }
>("moduleMeta/update", async ({ name, updates }, thunkAPI) => {
  try {
    const res = await apiCall(
      "patch",
      `/modules/meta/${encodeURIComponent(name)}`,
      updates
    );
    return res?.data as IModuleMeta;
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Update failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 5) DELETE
export const deleteModuleMeta = createAsyncThunk<
  { name: string },
  string,
  { rejectValue: string }
>("moduleMeta/delete", async (name, thunkAPI) => {
  try {
    await apiCall("delete", `/modules/meta/${encodeURIComponent(name)}`);
    return { name };
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Delete failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// 6) BULK IMPORT
export const importModuleMetas = createAsyncThunk<
  IModuleMeta[],
  IModuleMeta[],
  { rejectValue: string }
>("moduleMeta/importBulk", async (metaArray, thunkAPI) => {
  try {
    const res = await apiCall("post", "/modules/meta/bulk-import", {
      metas: metaArray,
    });
    return (res?.data as IModuleMeta[]) ?? [];
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || "Bulk import failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

// --- SLICE ---
const moduleMetaSlice = createSlice({
  name: "moduleMeta",
  initialState,
  reducers: {
    clearModuleMetaMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearSelectedModule: (state) => {
      state.selectedModule = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createModuleMeta.fulfilled, (state, action: PayloadAction<IModuleMeta>) => {
        if (action.payload) {
          state.modules.push(action.payload);
          state.successMessage = `Module "${action.payload.name}" created.`;
          toast.success(state.successMessage);
        }
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(createModuleMeta.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Module creation failed!";
        toast.error(state.error);
      })

      // FETCH ALL
      .addCase(fetchModuleMetas.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchModuleMetas.fulfilled, (state, action: PayloadAction<IModuleMeta[]>) => {
        state.modules = action.payload || [];
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(fetchModuleMetas.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Modules could not be fetched!";
        toast.error(state.error);
      })

      // FETCH BY NAME
      .addCase(fetchModuleMetaByName.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchModuleMetaByName.fulfilled, (state, action: PayloadAction<IModuleMeta>) => {
        state.selectedModule = action.payload ?? null;
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(fetchModuleMetaByName.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Fetch failed!";
        toast.error(state.error);
      })

      // UPDATE
      .addCase(updateModuleMeta.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateModuleMeta.fulfilled, (state, action: PayloadAction<IModuleMeta>) => {
        const updated = action.payload;
        if (updated) {
          const idx = state.modules.findIndex((m) => m.name === updated.name);
          if (idx !== -1) state.modules[idx] = updated;
          state.selectedModule = updated;
        }
        state.successMessage = "Module meta updated.";
        toast.success(state.successMessage);
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(updateModuleMeta.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Module meta could not be updated!";
        toast.error(state.error);
      })

      // DELETE
      .addCase(deleteModuleMeta.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteModuleMeta.fulfilled, (state, action: PayloadAction<{ name: string }>) => {
        state.modules = state.modules.filter((m) => m.name !== action.payload.name);
        state.successMessage = "Module meta deleted.";
        toast.success(state.successMessage);
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(deleteModuleMeta.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Delete failed!";
        toast.error(state.error);
      })

      // BULK IMPORT
      .addCase(importModuleMetas.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(importModuleMetas.fulfilled, (state, action: PayloadAction<IModuleMeta[]>) => {
        state.modules = action.payload || [];
        state.successMessage = "Module metas imported successfully.";
        toast.success(state.successMessage);
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(importModuleMetas.rejected, (state, action: any) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Bulk import failed!";
        toast.error(state.error);
      })

      // --- GENEL MATCHERLAR ---
      .addMatcher(
        (action) => action.type.startsWith("moduleMeta/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.status = "loading";
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("moduleMeta/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.status = "failed";
          state.error = action.payload?.message || action.payload || "Operation failed!";
          toast.error(state.error);
        }
      );
  },
});

export const { clearModuleMetaMessages, clearSelectedModule } = moduleMetaSlice.actions;
export default moduleMetaSlice.reducer;
