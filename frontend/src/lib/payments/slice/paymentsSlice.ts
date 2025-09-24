import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type {
  IPayment,
  PaymentsAdminFilters,
  PaymentStatus,
  IPaymentFee,
  IPaymentAllocation,
} from "../types";

const BASE = "/payments";

/* ---------------- helpers ---------------- */
const pick = <T,>(res: any, fb: T): T =>
  (res && typeof res === "object" && "data" in res ? (res.data as T) : ((res as T) ?? fb));

const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Objeden boş/undefined alanları at */
const compact = <T extends Record<string, any>>(o?: T): Partial<T> => {
  if (!o || typeof o !== "object") return {};
  const out: Record<string, any> = {};
  for (const k of Object.keys(o)) {
    const v = (o as any)[k];
    if (!isEmpty(v)) out[k] = v;
  }
  return out as Partial<T>;
};

/** Büyük harfe çevir (backend uppercase bekliyor bazı alanlarda) */
const toUpper = (s?: string) => (s ? String(s).trim().toUpperCase() : s);

/** Number normalizasyonu */
const toNumber = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** string veya populated nesneden id çıkar */
const idOf = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "_id" in (v as any)) return String((v as any)._id);
  return undefined;
};

/** Filtreleri temizle (boş stringleri gönderme) */
const normalizeFilters = (f?: PaymentsAdminFilters): Partial<PaymentsAdminFilters> => {
  const base = compact(f);
  if (base.amountMin !== undefined) base.amountMin = toNumber(base.amountMin);
  if (base.amountMax !== undefined) base.amountMax = toNumber(base.amountMax);
  if (base.limit !== undefined) base.limit = Math.max(1, Math.min(500, toNumber(base.limit, 200)));
  return base;
};

/** Payload normalize (backend pre-validate ile uyumlu) */
const normalizePaymentPayload = (p: Partial<IPayment>): Partial<IPayment> => {
  const payload: Partial<IPayment> = { ...p };

  // uppercase alanlar
  if (payload.code) payload.code = toUpper(payload.code);
  if (payload.currency) payload.currency = toUpper(payload.currency);

  // tarih alanları
  if (payload.receivedAt) payload.receivedAt = new Date(payload.receivedAt as any).toISOString();
  if (payload.bookedAt) payload.bookedAt = new Date(payload.bookedAt as any).toISOString();
  if (payload.reconciledAt) payload.reconciledAt = new Date(payload.reconciledAt as any).toISOString();

  // sayılar
  if (payload.grossAmount !== undefined) payload.grossAmount = toNumber(payload.grossAmount, 0);
  if (payload.fxRate !== undefined) payload.fxRate = toNumber(payload.fxRate, 0);

  // fees
  if (Array.isArray(payload.fees)) {
    payload.fees = payload.fees.map((f: IPaymentFee) => ({
      ...f,
      amount: toNumber(f.amount, 0),
      currency: toUpper(f.currency) || toUpper(payload.currency) || "", // boşsa backend payment.currency miras alıyor
    }));
  }

  // allocations: populated geldiyse _id'ye indir
  if (Array.isArray(payload.allocations)) {
    payload.allocations = payload.allocations.map((a: IPaymentAllocation) => ({
      ...a,
      invoice: idOf((a as any).invoice) as string, // backend string bekliyor
      amount: toNumber(a.amount, 0),
      appliedAt: a.appliedAt ? new Date(a.appliedAt as any).toISOString() : undefined,
    }));
  }

  // links: populated nesneleri _id'ye indir
  if (payload.links) {
    payload.links = {
      customer: idOf((payload.links as any).customer),
      apartment: idOf((payload.links as any).apartment),
      contract: idOf((payload.links as any).contract),
    };
  }

  // boş/undefined alanları sil
  return compact(payload);
};

/* ---------------- state ---------------- */
interface State {
  items: IPayment[];
  selected: IPayment | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}
const initialState: State = { items: [], selected: null, loading: false, error: null, success: null };

/* ---------------- thunks ---------------- */
export const fetchPaymentsAdmin = createAsyncThunk<
  IPayment[],
  PaymentsAdminFilters | undefined,   
  { rejectValue: string }
>(
  "payments/fetchAll",
  async (filters, api) => {
    try {
      const res = await apiCall("get", BASE, normalizeFilters(filters as any));
      return pick<IPayment[]>(res, []);
    } catch (e: any) {
      return api.rejectWithValue(e?.data?.message ?? e?.message ?? "Fetch failed");
    }
  }
);


export const createPayment = createAsyncThunk<
  IPayment,
  Partial<IPayment>,
  { rejectValue: string }
>(
  "payments/create",
  async (payload, api) => {
    try {
      const res = await apiCall("post", BASE, normalizePaymentPayload(payload));
      return pick<IPayment>(res, {} as any);
    } catch (e: any) {
      return api.rejectWithValue(e?.data?.message ?? e?.message ?? "Create failed");
    }
  }
);

export const updatePayment = createAsyncThunk<
  IPayment,
  { id: string; changes: Partial<IPayment> },
  { rejectValue: string }
>(
  "payments/update",
  async ({ id, changes }, api) => {
    try {
      const res = await apiCall("put", `${BASE}/${id}`, normalizePaymentPayload(changes));
      return pick<IPayment>(res, {} as any);
    } catch (e: any) {
      return api.rejectWithValue(e?.data?.message ?? e?.message ?? "Update failed");
    }
  }
);

export const changePaymentStatus = createAsyncThunk<
  IPayment,
  { id: string; status: PaymentStatus },
  { rejectValue: string }
>(
  "payments/changeStatus",
  async ({ id, status }, api) => {
    try {
      const res = await apiCall("patch", `${BASE}/${id}/status`, { status });
      return pick<IPayment>(res, {} as any);
    } catch (e: any) {
      return api.rejectWithValue(e?.data?.message ?? e?.message ?? "Status change failed");
    }
  }
);

export const deletePayment = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>(
  "payments/delete",
  async (id, api) => {
    try {
      await apiCall("delete", `${BASE}/${id}`);
      return { id };
    } catch (e: any) {
      return api.rejectWithValue(e?.data?.message ?? e?.message ?? "Delete failed");
    }
  }
);

/* ---------------- slice ---------------- */
const slice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentMsgs: (s) => { s.error = null; s.success = null; },
    setSelectedPayment: (s, a: PayloadAction<IPayment | null>) => { s.selected = a.payload; },
    /** liste içinde tek kaydı inplace güncelle */
    upsertPaymentLocal: (s, a: PayloadAction<IPayment>) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.items[i] = a.payload; else s.items.unshift(a.payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchPaymentsAdmin.fulfilled, (s, a) => {
      s.items = a.payload; s.loading = false; s.error = null;
    });
    b.addCase(createPayment.fulfilled, (s, a) => {
      if (a.payload?._id) s.items.unshift(a.payload);
      s.loading = false; s.success = "Created.";
    });
    b.addCase(updatePayment.fulfilled, (s, a) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.items[i] = a.payload;
      s.loading = false; s.success = "Updated.";
    });
    b.addCase(changePaymentStatus.fulfilled, (s, a) => {
      const i = s.items.findIndex(x => x._id === a.payload._id);
      if (i !== -1) s.items[i] = a.payload;
      if (s.selected?._id === a.payload._id) s.selected = a.payload;
      s.loading = false; s.success = "Status updated.";
    });
    b.addCase(deletePayment.fulfilled, (s, a) => {
      s.items = s.items.filter(x => x._id !== a.payload.id);
      if (s.selected?._id === a.payload.id) s.selected = null;
      s.loading = false; s.success = "Deleted.";
    });

    // generic pending/rejected
    b.addMatcher(
      (ac) => ac.type.startsWith("payments/") && ac.type.endsWith("/pending"),
      (s) => { s.loading = true; s.error = null; s.success = null; }
    );
    b.addMatcher(
      (ac) => ac.type.startsWith("payments/") && ac.type.endsWith("/rejected"),
      (s: any, ac: any) => { s.loading = false; s.error = ac.payload || "Operation failed"; }
    );
  },
});

export const { clearPaymentMsgs, setSelectedPayment, upsertPaymentLocal } = slice.actions;
export default slice.reducer;
