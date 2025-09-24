// types/modules.ts
import type { SupportedLocale, TranslatedLabel } from "@/types/common";

export type RouteMeta = {
  method: string;
  path: string;
  auth?: boolean;
  summary?: string;
  body?: any;
};

export interface IModuleMetaHistory {
  version: string;
  by: string;
  date: string;   // ISO string gelecek (backend öyle gönderiyor)
  note?: string;
}

// ✅ Backend ile aynı: tenant + tüm alanlar
export interface IModuleMeta {
  tenant: string;                 // <-- eklendi
  name: string;                   // unique (tenant + name birlikte unique)
  label: TranslatedLabel;         // çoklu dil
  icon: string;                   // global default icon
  roles: string[];                // default global yetkiler
  enabled: boolean;               // global aktif/pasif
  language: SupportedLocale;      // ana dil
  version: string;
  order: number;
  statsKey?: string;
  history?: IModuleMetaHistory[]; // optional
  routes?: RouteMeta[];           // optional
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Tenant override alanları + SEO override’lar
export interface IModuleSetting {
  module: string;                 // FK (ModuleMeta.name)
  tenant: string;                 // <-- zorunlu
  enabled?: boolean;              // override
  visibleInSidebar?: boolean;     // override
  useAnalytics?: boolean;         // override
  showInDashboard?: boolean;      // override
  roles?: string[];               // override
  order?: number;                 // override

  // --- SEO override alanları (çoklu dil, backend ile aynı)
  seoTitle?: TranslatedLabel;
  seoDescription?: TranslatedLabel;
  seoSummary?: TranslatedLabel;
  seoOgImage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
