// src/modules/admin/routes.ts
import express from "express";

// 🔐 Auth & CSRF
import { requireAdmin } from "@/middleware/auth/requireAdmin";
import { csrf } from "@/middleware/auth/csrf";

// 🧪 Validation (recipes/validation.ts)
import {
  validateAdminListQuery,
  validateAdminStatusPatch,
} from "../recipes/validation";

// 📦 Upload
import { upload } from "@/middleware/uploadMiddleware";
import { uploadTypeWrapper } from "@/middleware/uploadTypeWrapper";

// 👇 Recipes admin controller (CRUD + media)
import {
  list as adminListRecipes,
  create as adminCreateRecipe,
  detail as adminGetRecipe,
  update as adminUpdateRecipe,
  remove as adminDeleteRecipe,
  updateStatus as adminUpdateRecipeStatus,
  addImages as adminAddRecipeImages,
  removeImage as adminRemoveRecipeImage,
  updateImageMeta as adminUpdateRecipeImageMeta,
  reorderImages as adminReorderRecipeImages,
  setCoverImage as adminSetRecipeCoverImage,
} from "../recipes/admin.controller";

const router = express.Router();

/* ===== Guards ===== */
router.use(requireAdmin);

/**
 * CSRF’i TÜM admin router’ına uygula.
 * - Güvenli methodlarda (GET/HEAD/OPTIONS) **token zorunlu tutulmaz**,
 *   sadece CSRF cookie’si üretir/yeniler.
 * - Yazma methodlarında (POST/PUT/PATCH/DELETE) doğrulama yapılır.
 *   (Bu davranış, `csrf` middleware’inin kendi iç kuralına bağlıdır.)
 */
router.use(csrf);

/* Yardımcı: ObjectId doğrulama */
const validateObjectId =
  (paramName: string) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const val = (req.params as any)[paramName];
    if (!val || !/^[a-fA-F0-9]{24}$/.test(String(val))) {
      return res.status(400).json({ error: `Invalid ObjectId: ${paramName}` });
    }
    next();
  };

/* (Opsiyonel) CSRF primer/debug: mevcut token’ı json döndürür */
router.get("/csrf", (req, res) => {
  const token = req.cookies?.[process.env.CSRF_COOKIE_NAME || "tt_csrf"] || "";
  res.json({ csrfToken: token });
});

/* ===== Admin — Recipes (List / Detail / CRUD / Publish) ===== */

// GET /api/admin/recipes?page&limit&q&status&tag&category
router.get("/", validateAdminListQuery, adminListRecipes);

// GET /api/admin/recipes/:id
router.get("/:id", validateObjectId("id"), adminGetRecipe);

// POST /api/admin/recipes
router.post(
  "/",
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  adminCreateRecipe
);

// PUT /api/admin/recipes/:id
router.put(
  "/:id",
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  validateObjectId("id"),
  adminUpdateRecipe
);

// PATCH /api/admin/recipes/:id/status   { isPublished: boolean }
router.patch(
  "/:id/status",
  validateObjectId("id"),
  validateAdminStatusPatch,
  adminUpdateRecipeStatus
);

// DELETE /api/admin/recipes/:id
router.delete("/:id", validateObjectId("id"), adminDeleteRecipe);

/* ===== Admin — Recipes (Media) ===== */

// POST /api/admin/recipes/:id/images
router.post(
  "/:id/images",
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  validateObjectId("id"),
  adminAddRecipeImages
);

// PATCH /api/admin/recipes/:id/images/reorder
router.patch(
  "/:id/images/reorder",
  validateObjectId("id"),
  adminReorderRecipeImages
);

// PATCH /api/admin/recipes/:id/images/:publicId
router.patch(
  "/:id/images/:publicId",
  validateObjectId("id"),
  adminUpdateRecipeImageMeta
);

// PATCH /api/admin/recipes/:id/cover/:publicId
router.patch(
  "/:id/cover/:publicId",
  validateObjectId("id"),
  adminSetRecipeCoverImage
);

// DELETE /api/admin/recipes/:id/images/:publicId
router.delete(
  "/:id/images/:publicId",
  validateObjectId("id"),
  adminRemoveRecipeImage
);

/* Basit diagnostic: /api/admin/recipes/diag  */
router.get("/diag", (req, res) => {
  const csrfCookieName = process.env.CSRF_COOKIE_NAME || "tt_csrf";
  const hasCsrfCookie = !!req.cookies?.[csrfCookieName];

  res.json({
    ok: true,
    now: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    storageProvider: process.env.STORAGE_PROVIDER || "local",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
      hasKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || null,
    },
    csrf: {
      cookieName: csrfCookieName,
      hasCookie: hasCsrfCookie,
      note: "GET isteklerinde token zorunlu değil; yazma methodlarında kontrol edilir.",
    },
  });
});

/* Sağlık kontrolü: /api/admin/recipes/ping */
router.get("/ping", (_req, res) => {
  res.json({ ok: true, pong: true, ts: Date.now() });
});





export default router;
