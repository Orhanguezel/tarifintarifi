// src/utils/deleteUploadedFiles.ts
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
// ⬇️ UPLOAD_FOLDERS artık buradan
import { UPLOAD_FOLDERS, type UploadFolderKey } from "@/middleware/upload.constants";

/** Local dosyaları sil (url listesi ile) */
export const deleteUploadedFilesLocal = (
  imageUrls: string[],
  folderKey: UploadFolderKey,
  tenantSlug: string
) => {
  const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;
  const baseDir = path.join("uploads", tenantSlug, folder);

  for (const url of imageUrls) {
    const filename = path.basename(url);
    const main = path.join(baseDir, filename);
    const thumb = path.join(baseDir, `${filename.replace(/\.[^.]+$/, "")}.thumb${path.extname(filename)}`);
    const webp  = path.join(baseDir, `${filename.replace(/\.[^.]+$/, "")}.webp`);

    [main, thumb, webp].forEach(p => {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) { console.error("delete error:", p, e); }
      }
    });
  }
};

/** Cloudinary public_id listesi ile sil */
export const deleteUploadedFilesCloudinary = async (publicIds: string[]) => {
  if (!publicIds.length) return;
  for (const pid of publicIds) {
    try { await cloudinary.uploader.destroy(pid); } catch { /* no-op */ }
  }
};
