import type { SupportedLocale } from "@/types/common";

export type TranslatedLabel = { [sectionKey in SupportedLocale]: string };

export interface ISectionMeta {
  tenant: string;         
  sectionKey: string;
  label: TranslatedLabel;
  description?: TranslatedLabel;
  icon: string;
  variant?: string;
  required?: boolean;
  defaultOrder: number;
  defaultEnabled: boolean;
  params?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISectionSetting {
  tenant: string;
  sectionKey: string;
  enabled?: boolean;
  order?: number;
  label?: TranslatedLabel;
  description?: TranslatedLabel;
  variant?: string;
  params?: Record<string, any>;
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
