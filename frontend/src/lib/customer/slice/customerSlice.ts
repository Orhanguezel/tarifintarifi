// src/modules/customer/slice/customerSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ICustomer, CustomerKind } from "../types";

// --- State ---
interface CustomerState {
  customers: ICustomer[];      // public tarafı (ops.)
  customerAdmin: ICustomer[];  // admin liste
  selected: ICustomer | null;
  loading: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  successMessage: string | null;
}
const initialState: CustomerState = {
  customers: [],
  customerAdmin: [],
  selected: null,
  loading: false,
  status: "idle",
  error: null,
  successMessage: null,
};

const BASE = "/customer";

// ---- Helpers ----
const buildQuery = (q?: Record<string, any>) => {
  if (!q) return "";
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
};

// --- Async Thunks ---

// Admin listesi - opsiyonel sorgu desteği (q, kind, isActive)
export type CustomersAdminQuery = Partial<{
  q: string;
  kind: CustomerKind;
  isActive: boolean;
}>;
export const fetchCustomersAdmin = createAsyncThunk<
  ICustomer[],
  CustomersAdminQuery | void,
  { rejectValue: string }
>("customer/fetchCustomersAdmin", async (query, { rejectWithValue }) => {
  try {
    const qs = buildQuery(query || undefined);
    const result = await apiCall("get", `${BASE}/admin${qs}`, null, rejectWithValue);
    // backend { success, message, data } döner; apiCall data'yı passthrough yapıyorsa bu satır uyumludur
    return result.data as ICustomer[];
  } catch (error: any) {
    return rejectWithValue(error?.message || "Admin müşteri listesi getirilemedi.");
  }
});

// Admin - tek müşteri
export const fetchCustomerById = createAsyncThunk<
  ICustomer,
  string,
  { rejectValue: string }
>("customer/fetchCustomerById", async (id, { rejectWithValue }) => {
  try {
    const result = await apiCall("get", `${BASE}/admin/${id}`, null, rejectWithValue);
    return result.data as ICustomer;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Müşteri bulunamadı.");
  }
});

// Admin - oluştur
export type CreateCustomerPayload = Partial<
  Omit<ICustomer, "_id" | "createdAt" | "updatedAt">
>;
export const createCustomerAdmin = createAsyncThunk<
  ICustomer,
  CreateCustomerPayload,
  { rejectValue: string }
>("customer/createCustomerAdmin", async (data, { rejectWithValue }) => {
  try {
    const result = await apiCall("post", `${BASE}/admin`, data, rejectWithValue);
    return result.data as ICustomer;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Müşteri oluşturulamadı.");
  }
});

// Admin - güncelle
export type UpdateCustomerPayload = {
  id: string;
  data: Partial<Omit<ICustomer, "_id" | "tenant" | "createdAt" | "updatedAt">>;
};
export const updateCustomerAdmin = createAsyncThunk<
  ICustomer,
  UpdateCustomerPayload,
  { rejectValue: string }
>("customer/updateCustomerAdmin", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await apiCall("put", `${BASE}/admin/${id}`, data, rejectWithValue);
    return result.data as ICustomer;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Müşteri güncellenemedi.");
  }
});

// Admin - sil
export const deleteCustomerAdmin = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("customer/deleteCustomerAdmin", async (id, { rejectWithValue }) => {
  try {
    await apiCall("delete", `${BASE}/admin/${id}`, null, rejectWithValue);
    return id;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Müşteri silinemedi.");
  }
});

// --- PUBLIC --- Kendi kaydını oku/güncelle
export const fetchCustomerPublicById = createAsyncThunk<
  ICustomer,
  string,
  { rejectValue: string }
>("customer/fetchCustomerPublicById", async (id, { rejectWithValue }) => {
  try {
    const result = await apiCall("get", `${BASE}/public/${id}`, null, rejectWithValue);
    return result.data as ICustomer;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Müşteri bulunamadı.");
  }
});

export const updateCustomerPublic = createAsyncThunk<
  ICustomer,
  { id: string; data: Partial<Pick<ICustomer, "companyName" | "contactName" | "email" | "phone" | "notes">> },
  { rejectValue: string }
>("customer/updateCustomerPublic", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await apiCall("put", `${BASE}/public/${id}`, data, rejectWithValue);
    return result.data as ICustomer;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Bilgiler güncellenemedi.");
  }
});

// --- SLICE ---
const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    clearCustomerMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    setSelectedCustomer(state, action: PayloadAction<ICustomer | null>) {
      state.selected = action.payload;
    },
    clearCustomers(state) {
      state.customers = [];
      state.customerAdmin = [];
      state.selected = null;
      state.status = "idle";
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- ADMIN ---
      .addCase(fetchCustomersAdmin.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null;
      })
      .addCase(fetchCustomersAdmin.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded"; state.customerAdmin = action.payload;
      })
      .addCase(fetchCustomersAdmin.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Admin müşteri listesi getirilemedi.";
      })

      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded"; state.selected = action.payload;
        // admin listede varsa güncelle
        state.customerAdmin = state.customerAdmin.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri bulunamadı.";
      })

      .addCase(createCustomerAdmin.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null; state.successMessage = null;
      })
      .addCase(createCustomerAdmin.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded";
        // varsa en üste ekle, duplicate engelle
        const exists = state.customerAdmin.some(c => c._id === action.payload._id);
        state.customerAdmin = exists
          ? state.customerAdmin.map(c => (c._id === action.payload._id ? action.payload : c))
          : [action.payload, ...state.customerAdmin];
        state.successMessage = "Müşteri başarıyla eklendi.";
      })
      .addCase(createCustomerAdmin.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri oluşturulamadı.";
      })

      .addCase(updateCustomerAdmin.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null; state.successMessage = null;
      })
      .addCase(updateCustomerAdmin.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded";
        state.customerAdmin = state.customerAdmin.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
        state.successMessage = "Müşteri güncellendi.";
      })
      .addCase(updateCustomerAdmin.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri güncellenemedi.";
      })

      .addCase(deleteCustomerAdmin.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null; state.successMessage = null;
      })
      .addCase(deleteCustomerAdmin.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded";
        state.customerAdmin = state.customerAdmin.filter((c) => c._id !== action.payload);
        if (state.selected?._id === action.payload) state.selected = null;
        state.successMessage = "Müşteri silindi.";
      })
      .addCase(deleteCustomerAdmin.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri silinemedi.";
      })

      // --- PUBLIC ---
      .addCase(fetchCustomerPublicById.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null;
      })
      .addCase(fetchCustomerPublicById.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded"; state.selected = action.payload;
        state.customers = state.customers.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(fetchCustomerPublicById.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri bulunamadı.";
      })
      .addCase(updateCustomerPublic.pending, (state) => {
        state.loading = true; state.status = "loading"; state.error = null; state.successMessage = null;
      })
      .addCase(updateCustomerPublic.fulfilled, (state, action) => {
        state.loading = false; state.status = "succeeded";
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
        state.customers = state.customers.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        state.successMessage = "Müşteri bilgileri güncellendi.";
      })
      .addCase(updateCustomerPublic.rejected, (state, action) => {
        state.loading = false; state.status = "failed";
        state.error = action.payload || "Müşteri güncellenemedi.";
      });
  },
});

export const {
  clearCustomerMessages,
  setSelectedCustomer,
  clearCustomers,
} = customerSlice.actions;

export default customerSlice.reducer;
