import type { SupportedLocale } from "@/types/common";

export interface ICatalogRequest {
  _id?: string;
  name: string;
  tenant: string;
  email: string;
  phone?: string;
  company?: string;
  locale: SupportedLocale;
  catalogType?: string;
  sentCatalog?: {
    url: string;
    fileName: string;
    fileSize?: number;
  };
  subject: string;
  message?: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface CatalogRequestPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  locale: SupportedLocale;
  subject: string;
  message?: string;
  catalogFileUrl: string;
  catalogFileName?: string;
}
