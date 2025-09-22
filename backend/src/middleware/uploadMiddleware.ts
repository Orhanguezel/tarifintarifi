// src/middleware/uploadMiddleware.ts
import multer, { FileFilterCallback } from "multer";
import path from "path";
import express from "express";
import type { Request } from "express";
import { storageAdapter } from "./storageAdapter";

// ⬇️ merkezi sabitler
import { UPLOAD_FOLDERS, BASE_UPLOAD_DIR, type UploadFolderKey } from "./upload.constants";

export { UPLOAD_FOLDERS, BASE_UPLOAD_DIR };

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
const allowedMimeTypes = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "application/pdf",
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(new Error(`Unsupported file type: ${file.originalname}`));
  }
  cb(null, true);
};

export const upload = (type: UploadFolderKey) => {
  return multer({
    storage: storageAdapter((process.env.STORAGE_PROVIDER as "local" | "cloudinary") || "local"),
    limits: { fileSize: reqLimit(type) },
    fileFilter,
  });
};

function reqLimit(type: UploadFolderKey) {
  const map = { recipe: 30 * 1024 * 1024, files: 50 * 1024 * 1024, default: 20 * 1024 * 1024 };
  return map[type] ?? map.default;
}

export const serveUploads = express.static(BASE_UPLOAD_DIR);
