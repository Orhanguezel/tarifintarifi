import type { SupportedLocale } from "@/types/common";

/** Çok dilli alan — opsiyonel key’ler (BE kısmi girişe izin veriyor) */
export type TranslatedField = Partial<Record<SupportedLocale, string>>;

// Görsel
export interface INewsImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  _id?: string;
}

// Haber
export interface INews {
  _id: string;
  title: TranslatedField;
  slug: string;                 // public unique
  summary: TranslatedField;
  content: TranslatedField;

  tenant: string;
  tags: string[];
  images: INewsImage[];

  category:
    | string
    | {
        _id: string;
        name: TranslatedField;
      };

  author: string;
  isPublished: boolean;
  isActive: boolean;
  publishedAt?: string;

  comments: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Kategori
export interface NewsCategory {
  _id: string;
  name: TranslatedField;
  slug: string;
  description?: TranslatedField;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** BE response zarfı */
export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
};

/** Liste parametreleri */
export type NewsListParams = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: string;                // örn: "-publishedAt"
  locale?: SupportedLocale;
};

/** Slug ile tek kayıt */
export type NewsBySlugParams = {
  slug: string;
  locale?: SupportedLocale;
};
