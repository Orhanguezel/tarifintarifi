import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { IInvoice, InvoiceListFilters, InvoiceStatus } from "../types";

const BASE = "/invoicing" as const;

const pickData = <T,>(res: any, fallback: T): T =>
  res && typeof res === "object" && "data" in res ? (res.data as T) : ((res as T) ?? fallback);

interface InvoicesState {
  invoicesAdmin: IInvoice[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  selected: IInvoice | null;
}

const initialState: InvoicesState = {
  invoicesAdmin: [],
  loading: false,
  error: null,
  successMessage: null,
  selected: null,
};

/** GET /invoicing — admin list (no pagination meta from backend) */
export const fetchAllInvoicesAdmin = createAsyncThunk<
  IInvoice[], InvoiceListFilters | void, { rejectValue: string }
>("invoices/fetchAllAdmin", async (filters, thunkAPI) => {
  try {
    const res = await apiCall("get", BASE, filters as any);
    return pickData<IInvoice[]>(res, []);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Fetch failed");
  }
});

/** POST /invoicing */
export const createInvoice = createAsyncThunk<
  IInvoice, Partial<IInvoice>, { rejectValue: string }
>("invoices/create", async (payload, thunkAPI) => {
  try {
    const res = await apiCall("post", BASE, payload);
    return pickData<IInvoice>(res, {} as IInvoice);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Create failed");
  }
});

/** PUT /invoicing/:id */
export const updateInvoice = createAsyncThunk<
  IInvoice, { id: string; changes: Partial<IInvoice> }, { rejectValue: string }
>("invoices/update", async ({ id, changes }, thunkAPI) => {
  try {
    const res = await apiCall("put", `${BASE}/${id}`, changes);
    return pickData<IInvoice>(res, {} as IInvoice);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Update failed");
  }
});

/** PATCH /invoicing/:id/status */
export const changeInvoiceStatus = createAsyncThunk<
  IInvoice, { id: string; status: InvoiceStatus }, { rejectValue: string }
>("invoices/changeStatus", async ({ id, status }, thunkAPI) => {
  try {
    const res = await apiCall("patch", `${BASE}/${id}/status`, { status });
    return pickData<IInvoice>(res, {} as IInvoice);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Status change failed");
  }
});

/** DELETE /invoicing/:id */
export const deleteInvoice = createAsyncThunk<
  { id: string }, string, { rejectValue: string }
>("invoices/delete", async (id, thunkAPI) => {
  try {
    await apiCall("delete", `${BASE}/${id}`);
    return { id };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.data?.message ?? err?.message ?? "Delete failed");
  }
});

const slice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearInvoiceMessages: (s) => { s.error = null; s.successMessage = null; },
    setSelectedInvoice: (s, a: PayloadAction<IInvoice | null>) => { s.selected = a.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchAllInvoicesAdmin.fulfilled, (s, a) => {
      s.invoicesAdmin = a.payload ?? []; s.loading = false; s.error = null;
    });
    b.addCase(createInvoice.fulfilled, (s, a) => {
      if (a.payload?._id) s.invoicesAdmin.unshift(a.payload);
      s.successMessage = "Created."; s.loading = false;
    });
    b.addCase(updateInvoice.fulfilled, (s, a) => {
      const i = s.invoicesAdmin.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.invoicesAdmin[i] = a.payload;
      s.successMessage = "Updated."; s.loading = false;
    });
    b.addCase(changeInvoiceStatus.fulfilled, (s, a) => {
      const i = s.invoicesAdmin.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.invoicesAdmin[i] = a.payload;
      s.successMessage = "Status changed."; s.loading = false;
    });
    b.addCase(deleteInvoice.fulfilled, (s, a) => {
      s.invoicesAdmin = s.invoicesAdmin.filter(x => x._id !== a.payload.id);
      s.successMessage = "Deleted."; s.loading = false;
    });

    b.addMatcher((ac) => ac.type.startsWith("invoices/") && ac.type.endsWith("/pending"),
      (s) => { s.loading = true; s.error = null; s.successMessage = null; });
    b.addMatcher((ac: any) => ac.type.startsWith("invoices/") && ac.type.endsWith("/rejected"),
      (s, ac: any) => { s.loading = false; s.error = ac.payload || "Operation failed"; });
  }
});

export const { clearInvoiceMessages, setSelectedInvoice } = slice.actions;
export default slice.reducer;
