// src/utils/deleteUploadedFiles.ts
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Upload sabitleri
import { UPLOAD_FOLDERS, BASE_UPLOAD_DIR, type UploadFolderKey } from "@/middleware/upload.constants";

/** Local dosyaları sil (url listesi ile) */
export const deleteUploadedFilesLocal = (
  imageUrls: string[],
  folderKey: UploadFolderKey
) => {
  const folder = UPLOAD_FOLDERS[folderKey] || UPLOAD_FOLDERS.default;
  const baseDir = path.join(BASE_UPLOAD_DIR, folder);

  for (const url of imageUrls) {
    // URL, /uploads/recipe/abc.jpg veya http://.../uploads/recipe/abc.jpg olabilir → sadece dosya adı
    const filename = path.basename(url);
    const ext = path.extname(filename);
    const nameNoExt = filename.replace(/\.[^.]+$/, "");

    const main  = path.join(baseDir, filename);
    const thumb = path.join(baseDir, `${nameNoExt}.thumb${ext}`);
    const webp  = path.join(baseDir, `${nameNoExt}.webp`);

    for (const p of [main, thumb, webp]) {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) { console.error("[deleteUploadedFilesLocal] unlink error:", p, e); }
      }
    }
  }
};

/** Cloudinary public_id listesi ile sil (türevleriyle) */
export const deleteUploadedFilesCloudinary = async (publicIds: string[]) => {
  if (!publicIds.length) return;

  // Tek tek silerken invalidate ver, ardından toplu API çağrısı ile türevleri temizle
  for (const pid of publicIds) {
    try {
      await cloudinary.uploader.destroy(pid, { invalidate: true, resource_type: "image" });
      // Thumb/webp gibi named transformation’lar varsa, çoğu zaman invalidate yeter.
      // Yine de garanti için explicit ile cache kır:
      try { await cloudinary.uploader.explicit(pid, { type: "upload", invalidate: true, resource_type: "image" }); } catch {}
    } catch (e) {
      console.error("[deleteUploadedFilesCloudinary] destroy error:", pid, e);
    }
  }

  // Ekstra temizlik (rate limit’e takılmasın diye try/catch)
  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: "image", type: "upload" as any });
  } catch {}
};
