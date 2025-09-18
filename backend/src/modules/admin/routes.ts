// src/modules/admin/routes.ts
import express from "express";

// 🔐 Mevcut auth middleware'lerin (relative path!)
import { requireAdmin } from "@/middleware/auth/requireAdmin";
import { csrf } from "@/middleware/auth/csrf";

// 🧪 Validation (recipes/validation.ts)
import {
  validateAdminListQuery,
  validateAdminStatusPatch
} from "../recipes/validation";

// 📦 Upload (relative paths!)
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
  setCoverImage as adminSetRecipeCoverImage
} from "../recipes/admin.controller";

const router = express.Router();

/* Guard */
router.use(requireAdmin);

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

/* Admin — Recipes (List / Detail / CRUD / Publish) */

// GET /api/admin/recipes?page&limit&q&status&tag&category
router.get("/", validateAdminListQuery, adminListRecipes);

// GET /api/admin/recipes/:id
router.get("/:id", validateObjectId("id"), adminGetRecipe);

// POST /api/admin/recipes
router.post(
  "/",
  csrf,
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  adminCreateRecipe
);

// PUT /api/admin/recipes/:id
router.put(
  "/:id",
  csrf,
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  validateObjectId("id"),
  adminUpdateRecipe
);

// PATCH /api/admin/recipes/:id/status   { isPublished: boolean }
router.patch(
  "/:id/status",
  csrf,
  validateObjectId("id"),
  validateAdminStatusPatch,
  adminUpdateRecipeStatus
);

// DELETE /api/admin/recipes/:id
router.delete("/:id", csrf, validateObjectId("id"), adminDeleteRecipe);

/* Admin — Recipes (Media) */

// POST /api/admin/recipes/:id/images
router.post(
  "/:id/images",
  csrf,
  uploadTypeWrapper("recipe"),
  upload("recipe").array("images", 20),
  validateObjectId("id"),
  adminAddRecipeImages
);

// PATCH /api/admin/recipes/:id/images/reorder
router.patch(
  "/:id/images/reorder",
  csrf,
  validateObjectId("id"),
  adminReorderRecipeImages
);

// PATCH /api/admin/recipes/:id/images/:publicId
router.patch(
  "/:id/images/:publicId",
  csrf,
  validateObjectId("id"),
  adminUpdateRecipeImageMeta
);

// PATCH /api/admin/recipes/:id/cover/:publicId
router.patch(
  "/:id/cover/:publicId",
  csrf,
  validateObjectId("id"),
  adminSetRecipeCoverImage
);

// DELETE /api/admin/recipes/:id/images/:publicId
router.delete(
  "/:id/images/:publicId",
  csrf,
  validateObjectId("id"),
  adminRemoveRecipeImage
);

export default router;
