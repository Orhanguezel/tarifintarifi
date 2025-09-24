import type { SupportedLocale } from "@/types/common";

/** Ortak çok dilli alan tipi */
export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;

/** Görsel */
export interface IEnsotekprodImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
}

/** Ürün */
export interface IEnsotekprod {
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
  images: IEnsotekprodImage[];

  // Teknik opsiyoneller
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

/** Kategori görseli */
export interface CategoryImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  altText?: TranslatedLabel;
}

/** Kategori */
export interface EnsotekCategory {
  _id: string;
  name: TranslatedLabel;
  description?: TranslatedLabel;
  slug: string;
  images?: CategoryImage[];
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

/** Listeleme parametreleri */
export type ProductsListParams = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: string; // örn: "-createdAt" | "price" vb.
  locale?: SupportedLocale;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  isPublished?: boolean;
};

/** Slug ile tek kayıt */
export type ProductBySlugParams = {
  slug: string;
  locale?: SupportedLocale;
};
