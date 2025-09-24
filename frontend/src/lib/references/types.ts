import type { SupportedLocale } from "@/types/common";

// Çok dilli alan
export type TranslatedField = { [lang in SupportedLocale]?: string };

// Görsel
export interface IReferencesImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  _id?: string;
}

// Ana referans (logo + içerik opsiyonel)
export interface IReferences {
  _id: string;
  title?: TranslatedField;
  slug: string;
  content?: TranslatedField;
  tenant: string;
  images: IReferencesImage[];
  category:
    | string
    | {
        _id: string;
        name: TranslatedField;
      };
  isPublished: boolean;
  isActive: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Kategori
export interface ReferencesCategory {
  _id: string;
  name: TranslatedField;
  slug: string;
  description?: TranslatedField;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** BE response kalıbı */
export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
};

/** Liste parametreleri */
export type ReferencesListParams = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: string; // örn: "-publishedAt"
  locale?: SupportedLocale;
};

/** Slug tekil getir */
export type ReferencesBySlugParams = {
  slug: string;
  locale?: SupportedLocale;
};
