import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { IFileObject, FilesAdminFilters } from "../types";

const BASE = "/files/admin";

const pickData = <T,>(res: any, fallback: T): T =>
  res && typeof res === "object" && "data" in res ? (res.data as T) : ((res as T) ?? fallback);

interface FilesState {
  items: IFileObject[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  selected: IFileObject | null;
}
const initialState: FilesState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
  selected: null,
};

/** GET /files — admin list */
export const fetchAllFilesAdmin = createAsyncThunk<
  IFileObject[], FilesAdminFilters | void, { rejectValue: string }
>("files/fetchAllAdmin", async (filters, thunkAPI) => {
  try {
    const res = await apiCall("get", `${BASE}`, filters as any);
    return pickData<IFileObject[]>(res, []);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Fetch failed");
  }
});

/** POST /files — çoklu upload (field: files) */
export const uploadFiles = createAsyncThunk<
  IFileObject[], { files: File[] }, { rejectValue: string }
>("files/upload", async ({ files }, thunkAPI) => {
  try {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await apiCall("post", `${BASE}`, fd);
    return pickData<IFileObject[]>(res, []);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Upload failed");
  }
});

/** GET /files/:id */
export const getFileById = createAsyncThunk<
  IFileObject, string, { rejectValue: string }
>("files/getById", async (id, thunkAPI) => {
  try {
    const res = await apiCall("get", `${BASE}/${id}`);
    return pickData<IFileObject>(res, {} as IFileObject);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Fetch failed");
  }
});

/** PUT /files/:id/link  { module, refId } */
export const linkFile = createAsyncThunk<
  IFileObject, { id: string; module: string; refId: string }, { rejectValue: string }
>("files/link", async ({ id, module, refId }, thunkAPI) => {
  try {
    const res = await apiCall("put", `${BASE}/${id}/link`, { module, refId });
    return pickData<IFileObject>(res, {} as IFileObject);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Link failed");
  }
});

/** PUT /files/:id/unlink  { module, refId } */
export const unlinkFile = createAsyncThunk<
  IFileObject, { id: string; module: string; refId: string }, { rejectValue: string }
>("files/unlink", async ({ id, module, refId }, thunkAPI) => {
  try {
    const res = await apiCall("put", `${BASE}/${id}/unlink`, { module, refId });
    return pickData<IFileObject>(res, {} as IFileObject);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Unlink failed");
  }
});

/** DELETE /files/:id (soft delete) */
export const deleteFile = createAsyncThunk<
  { id: string }, string, { rejectValue: string }
>("files/delete", async (id, thunkAPI) => {
  try {
    await apiCall("delete", `${BASE}/${id}`);
    return { id };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Delete failed");
  }
});

const slice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearFileMessages: (s) => { s.error = null; s.successMessage = null; },
    setSelectedFile: (s, a: PayloadAction<IFileObject | null>) => { s.selected = a.payload; },
    upsertOneFileLocal: (s, a: PayloadAction<IFileObject>) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i === -1) s.items.unshift(a.payload); else s.items[i] = a.payload;
    }
  },
  extraReducers: (b) => {
    b.addCase(fetchAllFilesAdmin.fulfilled, (s, a) => {
      s.items = a.payload ?? []; s.loading = false; s.error = null;
    });
    b.addCase(uploadFiles.fulfilled, (s, a) => {
      if (Array.isArray(a.payload)) s.items = [...a.payload, ...s.items];
      s.successMessage = "Uploaded."; s.loading = false;
    });
    b.addCase(getFileById.fulfilled, (s, a) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i === -1) s.items.unshift(a.payload); else s.items[i] = a.payload;
      s.loading = false;
    });
    b.addCase(linkFile.fulfilled, (s, a) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.items[i] = a.payload;
      s.successMessage = "Linked."; s.loading = false;
    });
    b.addCase(unlinkFile.fulfilled, (s, a) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.items[i] = a.payload;
      s.successMessage = "Unlinked."; s.loading = false;
    });
    b.addCase(deleteFile.fulfilled, (s, a) => {
      s.items = s.items.filter(x => x._id !== a.payload.id);
      s.successMessage = "Deleted."; s.loading = false;
    });

    b.addMatcher((ac) => ac.type.startsWith("files/") && ac.type.endsWith("/pending"),
      (s) => { s.loading = true; s.error = null; s.successMessage = null; });
    b.addMatcher((ac: any) => ac.type.startsWith("files/") && ac.type.endsWith("/rejected"),
      (s, ac: any) => { s.loading = false; s.error = ac.payload || "Operation failed"; });
  }
});

export const { clearFileMessages, setSelectedFile, upsertOneFileLocal } = slice.actions;
export default slice.reducer;
