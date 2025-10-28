// src/types/express.d.ts
import "express";
import type { SupportedLocale } from "./common";
// İkisi de çalışır; import tercih ediyorum ki tek kaynak olsun:
import type { UploadFolderKey } from "@/core/middleware/uploadTypeWrapper";

declare module "express-serve-static-core" {
  interface Request {
    // --- mevcutlar ---
    user?: { _id: string; email: string; role: "admin" | "editor" | "viewer" };
    locale?: SupportedLocale;
    t?: (key: string, defaultText?: string) => string;
    clientId?: string;

    // --- multi-tenant (upload & logs vs.) ---
    tenant?: string;

    // --- upload pipeline (middleware/uploadTypeWrapper.ts) ---
    uploadType?: UploadFolderKey;            // "recipe" | "files" | "default"
    uploadSizeLimit?: number;                // byte

    // --- multer alanları (tekli/çoklu) ---
    file?: Express.Multer.File;              // single() kullanımlarında
    files?:
      | Express.Multer.File[]               // array() kullanımlarında
      | Record<string, Express.Multer.File[]>; // fields() kullanımlarında { fieldName: File[] }
  }
}
