// src/modules/customer/types.ts
import type { Address } from "@/modules/users/types/address";

export type CustomerKind = "person" | "organization";
export type CurrencyCode = "USD" | "EUR" | "TRY";

export interface ICustomerBilling {
  taxNumber?: string;
  iban?: string;
  defaultCurrency?: CurrencyCode;
  paymentTermDays?: number;       // Net X gün
  defaultDueDayOfMonth?: number;  // 1-28
}

export interface ICustomer {
  _id?: string;

  tenant: string;

  // v2 alanları
  kind?: CustomerKind;            // kişi / kurum (ops.)
  companyName?: string;           // artık opsiyonel
  contactName: string;            // zorunlu
  email: string;                  // zorunlu (tenant + email unique)
  phone: string;                  // zorunlu (tenant + phone unique)
  slug?: string;                  // backend'de normalize ediliyor

  // user ile ilişki (opsiyonel)
  userRef?: string | null;        // ref: users._id

  // ilişkiler ve tercihler
  addresses?: Array<string | Address>;  // ref: address
  billing?: ICustomerBilling;
  tags?: string[];
  notes?: string;

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}
