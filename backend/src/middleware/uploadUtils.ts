// src/middleware/uploadUtils.ts
import path from "path";
import sharp from "sharp";
import { cloudinary } from "@/server/cloudinary";
import { UPLOAD_FOLDERS, type UploadFolderKey } from "./upload.constants";

/** Yalnızca local kullanırken (dev) thumb/webp üretelim */
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

/** Local public URL (tenant yok) */
export function buildLocalPublicUrl(
  file: Express.Multer.File,
  folderKey: UploadFolderKey,
  _req?: any
) {
  const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;
  const baseUrl = (process.env.BASE_URL || "http://localhost:5019").replace(/\/$/, "");
  return `${baseUrl}/uploads/${folder}/${file.filename}`;
}

/** Cloudinary URL helper'ları — version-aware + delivery transforms */
type CloudOpts = {
  version?: number | string;
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "center" | "face";
};

export function buildCloudinaryMainUrl(publicId: string, opts: CloudOpts = {}) {
  const { version } = opts;
  return cloudinary.url(publicId, {
    version: version as any,
    resource_type: "image",
    secure: true,
    transformation: [{ fetch_format: "auto", quality: "auto" }],
  });
}

export function buildCloudinaryThumbUrl(publicId: string, opts: CloudOpts = {}) {
  const { version, width = 300, height, crop = "fill", gravity = "auto" } = opts;
  return cloudinary.url(publicId, {
    version: version as any,
    resource_type: "image",
    secure: true,
    transformation: [
      { width, ...(height ? { height } : {}), crop, gravity },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

export function buildCloudinarySizedUrl(publicId: string, opts: CloudOpts) {
  const { version, width, height, crop = "fill", gravity = "auto" } = opts;
  return cloudinary.url(publicId, {
    version: version as any,
    resource_type: "image",
    secure: true,
    transformation: [
      { ...(width ? { width } : {}), ...(height ? { height } : {}), crop, gravity },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

/** Geriye dönük uyumluluk — mümkünse kullanma; f_auto yeterli. */
export function buildCloudinaryWebpUrl(publicId: string, opts: CloudOpts = {}) {
  const { version } = opts;
  return cloudinary.url(publicId, {
    version: version as any,
    resource_type: "image",
    secure: true,
    transformation: [{ fetch_format: "webp", quality: "auto" }],
  });
}
