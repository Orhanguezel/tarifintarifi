import type { SupportedLocale } from "@/types/common";

// Çok dilli alan
export type TranslatedField = { [lang in SupportedLocale]?: string };

// Görsel
export interface ILibraryImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  _id?: string;
}

// Dosya (PDF, DOCX…)
export interface ILibraryFile {
  url: string;
  name: string;
  size?: number;
  type?: string; // örn: "application/pdf"
  publicId?: string;
  _id?: string;
}

// Ana içerik
export interface ILibrary {
  _id: string;
  title: TranslatedField;
  slug: string;
  summary?: TranslatedField;
  content: TranslatedField;
  tenant: string;
  tags?: string[];
  images?: ILibraryImage[];
  files?: ILibraryFile[];
  category:
    | string
    | {
        _id: string;
        name: TranslatedField;
      };
  author?: string;
  isPublished: boolean;
  isActive: boolean;
  publishedAt?: string;
  comments?: string[];
  views: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Kategori
export interface LibraryCategory {
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

/** Liste parametreleri (public) */
export type LibraryListParams = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: string; // örn: "-publishedAt"
  locale?: SupportedLocale;
};

/** Slug ile tek kayıt */
export type LibraryBySlugParams = {
  slug: string;
  locale?: SupportedLocale;
};
