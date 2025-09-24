/* FE tarafı tipleri — ObjectId'ler string */
import type { SupportedLocale } from "@/types/common";

/** backend ile aynı yapı: dil anahtarları SupportedLocale */
export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;

export type InvoiceType = "invoice" | "creditNote";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "sent"
  | "partially_paid"
  | "paid"
  | "canceled";

export type ItemKind = "service" | "fee" | "product" | "custom";

export type Discount =
  | { type: "rate"; value: number }
  | { type: "amount"; value: number };

export interface IInvoicePartySnapshot {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine?: string;
  contactName?: string;
}

export interface IInvoiceLinks {
  customer?: string;
  apartment?: string;
  contract?: string;
  billingPlan?: string;
  billingOccurrences?: string[];

  // legacy
  order?: string;
  user?: string;
  company?: string;
}

export interface IInvoiceItem {
  kind: ItemKind;
  ref?: string;
  name: TranslatedLabel;
  description?: TranslatedLabel;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: Discount;
  taxRate?: number;
  rowSubtotal?: number;
  rowTax?: number;
  rowTotal?: number;
}

export interface IInvoiceTotals {
  currency: string;
  fxRate?: number;
  itemsSubtotal: number;
  itemsDiscountTotal: number;
  invoiceDiscountTotal: number;
  taxTotal: number;
  rounding?: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
}

export interface IInvoice {
  _id: string;
  tenant: string;
  code: string;
  type: InvoiceType;
  status: InvoiceStatus;

  issueDate: string | Date;
  dueDate?: string | Date;
  periodStart?: string | Date;
  periodEnd?: string | Date;

  seller: IInvoicePartySnapshot;
  buyer: IInvoicePartySnapshot;

  links?: IInvoiceLinks;

  items: IInvoiceItem[];
  invoiceDiscount?: Discount;
  totals: IInvoiceTotals;

  notes?: TranslatedLabel;
  terms?: TranslatedLabel;
  attachments?: Array<{ url: string; name?: string }>;

  sentAt?: string | Date;
  paidAt?: string | Date;

  reverses?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/* Liste filtreleri — backend query ile birebir */
export interface InvoiceListFilters {
  status?: InvoiceStatus;
  type?: InvoiceType;
  customer?: string;
  apartment?: string;
  contract?: string;
  billingPlan?: string;
  q?: string;               // code veya buyer.name
  issueFrom?: string;       // YYYY-MM-DD
  issueTo?: string;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;           // default 200 (max 500)
}
