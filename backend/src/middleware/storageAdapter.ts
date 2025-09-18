// src/core/middleware/storageAdapter.ts
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import fs from "fs";
import slugify from "slugify";

// ⬇️ merkezi sabitler + tenant helper
import { UPLOAD_FOLDERS, BASE_UPLOAD_DIR, type UploadFolderKey } from "./upload.constants";
import { getTenantSlug } from "./uploadMiddleware";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storageAdapter = (provider: "local" | "cloudinary") => {
  if (provider === "cloudinary") {
    return new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        const tenant = getTenantSlug(req);
        const folderKey = (req.uploadType as UploadFolderKey) || "default";
        const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;

        const base = file.originalname.replace(/\.[^/.]+$/, "");
        const safe = slugify(base, { lower: true, strict: true });
        const uid  = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const isImage = file.mimetype.startsWith("image/") && !file.originalname.toLowerCase().endsWith(".pdf");

        return {
          folder: `${process.env.CLOUDINARY_FOLDER || "tt"}/${tenant}/${folder}`,
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
      const tenant = getTenantSlug(req);
      const folderKey = (req.uploadType as UploadFolderKey) || "default";
      const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;
      const full = path.join(BASE_UPLOAD_DIR, tenant, folder);
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
