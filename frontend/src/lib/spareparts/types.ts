import type { SupportedLocale } from "@/types/common";

/** Çoklu dil etiket (strict: her dil key’i mevcut olmalı) */
export type TranslatedLabel = { [key in SupportedLocale]: string };

export interface ISparepartImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
}

export interface ISparepart {
  _id: string;

  // Temel
  name: TranslatedLabel;
  tenant: string;
  slug: string;
  description: TranslatedLabel;
  brand: string;
  category:
    | string
    | {
        _id: string;
        name: TranslatedLabel;
      };
  tags?: string[];

  // Stok & fiyat
  price: number;
  stock: number;
  stockThreshold?: number;

  // Görseller
  images: ISparepartImage[]; // en az 1 bekliyoruz

  // Teknik opsiyonel
  material?: string;
  color?: string[];
  weightKg?: number;
  size?: string;
  powerW?: number;
  voltageV?: number;
  flowRateM3H?: number;
  coolingCapacityKw?: number;

  // Elektrik opsiyonları
  isElectric: boolean;
  batteryRangeKm?: number;
  motorPowerW?: number;

  // Durum/meta
  isActive: boolean;
  isPublished: boolean;
  likes: number;
  comments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  altText?: Partial<TranslatedLabel>;
}

export interface SparepartCategory {
  _id: string;
  name: Partial<TranslatedLabel>;
  description?: Partial<TranslatedLabel>;
  slug: string;
  images?: CategoryImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** BE genel response zarfı */
export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
};

/** Listeleme parametreleri (public) */
export type SparepartsListParams = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: string; // örn: "-createdAt"
  locale?: SupportedLocale;
};

/** Slug ile tek kayıt */
export type SparepartBySlugParams = {
  slug: string;
  locale?: SupportedLocale;
};
