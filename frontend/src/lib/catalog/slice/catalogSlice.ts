import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { CatalogRequestPayload, ICatalogRequest } from "@/modules/catalog/types";

interface CatalogState {
  messagesAdmin: ICatalogRequest[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  deleteStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: CatalogState = {
  messagesAdmin: [],
  loading: false,
  error: null,
  successMessage: null,
  deleteStatus: "idle",
};

const BASE = "/catalog";

export const sendCatalogRequest = createAsyncThunk<ICatalogRequest, CatalogRequestPayload>(
  "catalog/sendCatalogRequest",
  async (payload, thunkAPI) => {
    try {
      const res = await apiCall("post", `${BASE}`, payload, thunkAPI.rejectWithValue);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        (err as any)?.response?.data?.message || "Failed to send catalog request"
      );
    }
  }
);

export const fetchAllCatalogRequests = createAsyncThunk<ICatalogRequest[]>(
  "catalog/fetchAllCatalogRequests",
  async (_, thunkAPI) => {
    try {
      const res = await apiCall("get", `${BASE}`, null, thunkAPI.rejectWithValue);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        (err as any)?.response?.data?.message || "Failed to fetch catalog requests"
      );
    }
  }
);

export const deleteCatalogRequest = createAsyncThunk<string, string>(
  "catalog/deleteCatalogRequest",
  async (id, thunkAPI) => {
    try {
      await apiCall("delete", `${BASE}/${id}`, null, thunkAPI.rejectWithValue);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        (err as any)?.response?.data?.message || "Failed to delete catalog request"
      );
    }
  }
);

export const markCatalogRequestAsRead = createAsyncThunk<ICatalogRequest, string>(
  "catalog/markCatalogRequestAsRead",
  async (id, thunkAPI) => {
    try {
      const res = await apiCall("patch", `${BASE}/${id}/read`, null, thunkAPI.rejectWithValue);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        (err as any)?.response?.data?.message || "Failed to mark as read"
      );
    }
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    clearCatalogState(state) {
      state.error = null;
      state.successMessage = null;
      state.deleteStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendCatalogRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendCatalogRequest.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Katalog talebiniz başarıyla iletildi.";
      })
      .addCase(sendCatalogRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Katalog talebi gönderilemedi.";
      })

      .addCase(fetchAllCatalogRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCatalogRequests.fulfilled, (state, action: PayloadAction<ICatalogRequest[]>) => {
        state.loading = false;
        state.messagesAdmin = action.payload;
      })
      .addCase(fetchAllCatalogRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Katalog talepleri alınamadı.";
      })

      .addCase(deleteCatalogRequest.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteCatalogRequest.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleteStatus = "succeeded";
        state.messagesAdmin = state.messagesAdmin.filter((msg) => msg._id !== action.payload);
        state.successMessage = "Talep başarıyla silindi.";
      })
      .addCase(deleteCatalogRequest.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = (action.payload as string) || "Talep silinemedi.";
      })

      .addCase(markCatalogRequestAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markCatalogRequestAsRead.fulfilled, (state, action: PayloadAction<ICatalogRequest>) => {
        state.loading = false;
        state.messagesAdmin = state.messagesAdmin.map((msg) =>
          msg._id === action.payload._id ? action.payload : msg
        );
        state.successMessage = "Talep okundu olarak işaretlendi.";
      })
      .addCase(markCatalogRequestAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Talep okundu olarak işaretlenemedi.";
      });
  },
});

export const { clearCatalogState } = catalogSlice.actions;
export default catalogSlice.reducer;
