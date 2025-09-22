// src/middleware/uploadUtils.ts
import path from "path";
import sharp from "sharp";
import { cloudinary } from "@/server/cloudinary";
// ⬇️ sadece klasör sabitleri; tenant yok
import { UPLOAD_FOLDERS, type UploadFolderKey } from "./upload.constants";

export function shouldProcessImage() {
  return (process.env.STORAGE_PROVIDER || "local") === "local";
}

export async function makeThumbAndWebp(fullPath: string) {
  const ext = path.extname(fullPath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return null;

  const dir = path.dirname(fullPath);
  const base = path.basename(fullPath, ext);

  const thumb = path.join(dir, `${base}.thumb${ext}`);
  const webp  = path.join(dir, `${base}.webp`);

  await sharp(fullPath).resize({ width: 300 }).toFile(thumb);
  await sharp(fullPath).toFormat("webp").toFile(webp);

  return { thumb, webp };
}

/**
 * Local public URL’i üretir.
 * Örn: http://localhost:5019/uploads/{folder}/{filename}
 * (tenant yok)
 */
export function buildLocalPublicUrl(
  file: Express.Multer.File,
  folderKey: UploadFolderKey,
  _req?: any
) {
  const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;
  const baseUrl = (process.env.BASE_URL || "http://localhost:5019").replace(/\/$/, "");
  return `${baseUrl}/uploads/${folder}/${file.filename}`;
}

export function buildCloudinaryThumbUrl(publicId: string) {
  return cloudinary.url(publicId, {
    transformation: [{ width: 300, crop: "scale" }],
    format: process.env.CLOUDINARY_FORMAT || "webp",
    secure: true,
    resource_type: "image",
  });
}

export function buildCloudinaryMainUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    format: process.env.CLOUDINARY_FORMAT || "webp",
  });
}

export function buildCloudinaryWebpUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    format: "webp",
  });
}
