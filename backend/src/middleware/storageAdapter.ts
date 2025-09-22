// src/middleware/storageAdapter.ts
import multer from "multer";
import { cloudinary } from "@/server/cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import fs from "fs";
import slugify from "slugify";

// ⬇️ sadece sabitler; tenant yok
import { UPLOAD_FOLDERS, BASE_UPLOAD_DIR, type UploadFolderKey } from "./upload.constants";


export const storageAdapter = (provider: "local" | "cloudinary") => {
  if (provider === "cloudinary") {
    return new CloudinaryStorage({
      cloudinary,
      params: async (_req, file) => {
        const reqAny = _req as any;
        const key: UploadFolderKey = reqAny?.uploadType || "default";
        const folder = UPLOAD_FOLDERS[key] || UPLOAD_FOLDERS.default;

        const base = file.originalname.replace(/\.[^/.]+$/, "");
        const safe = slugify(base, { lower: true, strict: true });
        const uid  = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const isImage =
          file.mimetype.startsWith("image/") &&
          !file.originalname.toLowerCase().endsWith(".pdf");

        // ➜ Tenant yok: {CLOUDINARY_FOLDER}/{folder}
        return {
          folder: `${process.env.CLOUDINARY_FOLDER || "tt"}/${folder}`,
          public_id: `${safe}-${uid}`,
          resource_type: isImage ? "image" : "raw",
          format: isImage ? (process.env.CLOUDINARY_FORMAT || "webp") : undefined,
        };
      },
    });
  }

  // LOCAL
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      const key: UploadFolderKey = (req as any)?.uploadType || "default";
      const folder = UPLOAD_FOLDERS[key] || UPLOAD_FOLDERS.default;

      // ➜ Tenant yok: BASE_UPLOAD_DIR/{folder}
      const full = path.join(BASE_UPLOAD_DIR, folder);
      if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
      cb(null, full);
    },
    filename: (_req, file, cb) => {
      const base = file.originalname.replace(/\.[^/.]+$/, "");
      const safe = slugify(base, { lower: true, strict: true });
      const uid  = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext  = path.extname(file.originalname).toLowerCase();
      cb(null, `${safe}-${uid}${ext}`);
    },
  });
};
