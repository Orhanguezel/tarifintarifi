// src/middleware/upload.constants.ts

/** Upload klasör anahtarları (tek kaynak) */
export type UploadFolderKey = "recipe" | "files" | "default";

/** Her anahtarın uploads içinde kullanılacak klasör adı */
export const UPLOAD_FOLDERS: Record<UploadFolderKey, string> = {
  recipe: "recipe",
  files:  "files",
  default:"misc",
};

/** Local storage kök klasörü */
export const BASE_UPLOAD_DIR = process.env.UPLOAD_ROOT || "uploads";
