// Backend ile bire bir hizalı tipler

export type PaymentKind =
  | "payment"
  | "refund"
  | "chargeback";

export type PaymentStatus =
  | "pending"
  | "confirmed"
  | "partially_allocated"
  | "allocated"
  | "failed"
  | "canceled";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "sepa"
  | "ach"
  | "card"
  | "wallet"
  | "check"
  | "other";

export interface IPayerSnapshot {
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine?: string;
}

export interface IInstrumentSnapshot {
  type?: "card" | "bank" | "cash" | "wallet" | "other";
  brand?: string;
  last4?: string;
  iban?: string;
  accountNoMasked?: string;
}

export interface IPaymentFee {
  type: "gateway" | "bank" | "manual";
  amount: number;
  currency: string; // Backend: serbest metin (EUR, TRY, USD, vb.)
  note?: string;
}

// Populated ref’ler için yardımcı generic
export type Ref<T = Record<string, unknown>> = { _id: string } & T;

export interface IPaymentAllocation {
  // Backend populate edebiliyor; bu yüzden union bıraktık
  invoice: string | Ref<{ code?: string; status?: string; totals?: { currency?: string } }>;
  invoiceCode?: string;
  amount: number;
  appliedAt?: string | Date;
  note?: string;
}

export interface IPaymentLinks {
  customer?: string | Ref<{ companyName?: string; contactName?: string; email?: string; phone?: string }>;
  apartment?: string | Ref<{ title?: string; slug?: string }>;
  contract?: string | Ref<{ code?: string; status?: string }>;
}

export interface IPayment {
  _id: string;

  tenant: string;
  code: string;              // PMT-YYYY-xxxx (backend uppercase)
  kind: PaymentKind;
  status: PaymentStatus;

  method: PaymentMethod;
  provider?: string;
  providerRef?: string;
  reference?: string;

  grossAmount: number;
  currency: string;          // Backend serbest
  fxRate?: number;
  fees?: IPaymentFee[];
  feeTotal?: number;
  netAmount?: number;

  receivedAt: string | Date;
  bookedAt?: string | Date;

  payer?: IPayerSnapshot;
  instrument?: IInstrumentSnapshot;

  links?: IPaymentLinks;

  allocations?: IPaymentAllocation[];
  allocatedTotal?: number;
  unappliedAmount?: number;

  metadata?: Record<string, unknown>;

  reconciled?: boolean;
  reconciledAt?: string | Date;
  statementRef?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** Admin liste/arama filtreleri */
export interface PaymentsAdminFilters {
  status?: PaymentStatus;
  kind?: PaymentKind;
  method?: PaymentMethod;
  provider?: string;
  customer?: string;
  apartment?: string;
  contract?: string;
  invoice?: string;
  reconciled?: boolean;
  q?: string;
  receivedFrom?: string; // YYYY-MM-DD
  receivedTo?: string;   // YYYY-MM-DD
  amountMin?: number;
  amountMax?: number;
  limit?: number;        // 1..500
}
