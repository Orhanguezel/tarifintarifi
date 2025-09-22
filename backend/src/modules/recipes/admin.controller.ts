// src/modules/recipes/admin.controller.ts
import type { Request, Response } from "express";
import { Types } from "mongoose";
import path from "path";

import { Recipe } from "./model";
import type {
  IRecipe,
  IRecipeImage,
  IRecipeIngredient,
  IRecipeStep,
  IRecipeTip,
  TranslatedLabel,
  DietFlag,
  AllergenFlag,
} from "./types";

import {
  shouldProcessImage,
  makeThumbAndWebp,
  buildLocalPublicUrl,
  buildCloudinaryMainUrl,
  buildCloudinaryThumbUrl,
  buildCloudinaryWebpUrl,
} from "@/middleware/uploadUtils";

import {
  deleteUploadedFilesLocal,
  deleteUploadedFilesCloudinary,
} from "@/utils/deleteUploadedFiles";

import { normalizeCategoryKey } from "./categories";
import { SUPPORTED_LOCALES } from "@/config/locales";

/* ================ shared error helper ================ */
const sendSaveError = (res: Response, err: any, fallback = "SAVE_FAILED") => {
  const msg = err?.message || err?.toString?.() || String(err);
  const code =
    err?.name === "ValidationError" || err?.name === "CastError" ? 422 : 400;
  return res.status(code).json({
    error: fallback,
    message: msg,
    details: err?.errors || null,
  });
};

/* ================= helpers ================= */

const parseIfJson = <T = any>(v: unknown): T | unknown => {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return v;
  }
};

const ensureTL = (v: unknown): TranslatedLabel | undefined => {
  const obj = parseIfJson<Record<string, string>>(v);
  if (obj && typeof obj === "object") return obj as TranslatedLabel;
  return undefined;
};

const mergeTL = (
  base: TranslatedLabel | undefined,
  patch: unknown
): TranslatedLabel | undefined => {
  const p = ensureTL(patch);
  if (!base && p) return p;
  if (!p) return base;
  return { ...(base || {}), ...p };
};

const ensureNumber = (v: unknown): number | undefined => {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const ensureBoolean = (v: unknown): boolean | undefined => {
  if (v === "" || v == null) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return undefined;
};

const ensureStringArray = (v: unknown): string[] | undefined => {
  if (v == null || v === "") return undefined;
  const parsed = parseIfJson(v);
  if (Array.isArray(parsed)) return parsed.map(String).filter((x) => x.trim() !== "");
  if (typeof parsed === "string")
    return parsed.split(",").map((s) => s.trim()).filter(Boolean);
  return undefined;
};

/* --- URL-safe slugify (server-side) --- */
const slugify = (s: string): string =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/* slug objesini güvenle parse + temizle */
const ensureSlugMap = (v: unknown): TranslatedLabel | undefined => {
  const obj = parseIfJson<Record<string, string>>(v);
  if (!obj || typeof obj !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(obj)) {
    const clean = slugify(String(val || ""));
    if (clean) out[k] = clean;
  }
  return Object.keys(out).length ? (out as TranslatedLabel) : undefined;
};

const DIET_FLAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "lactose-free",
] as const satisfies Readonly<DietFlag[]>;
const ALLERGEN_FLAGS = [
  "gluten",
  "dairy",
  "egg",
  "nuts",
  "peanut",
  "soy",
  "sesame",
  "fish",
  "shellfish",
] as const satisfies Readonly<AllergenFlag[]>;

function ensureEnumFlags<T extends string>(v: unknown, allowed: readonly T[]): T[] | undefined {
  const arr = ensureStringArray(v);
  if (!arr) return undefined;
  const set = new Set(arr.map((s) => s.toLowerCase()));
  const res = allowed.filter((a) => set.has(String(a))) as T[];
  return res.length ? res : [];
}

const ensureDietFlags = (v: unknown): DietFlag[] | undefined =>
  ensureEnumFlags<DietFlag>(v, DIET_FLAGS);
const ensureAllergenFlagEnums = (v: unknown): AllergenFlag[] | undefined =>
  ensureEnumFlags<AllergenFlag>(v, ALLERGEN_FLAGS);

const ensureIngredients = (v: unknown): IRecipeIngredient[] | undefined => {
  const p = parseIfJson(v);
  if (!Array.isArray(p)) return undefined;
  const out: IRecipeIngredient[] = [];
  for (const it of p) {
    const nameTL = ensureTL((it as any)?.name);
    if (!nameTL) continue;
    const amountTL = ensureTL((it as any)?.amount);
    const order = ensureNumber((it as any)?.order) ?? 0;
    out.push({ name: nameTL, amount: amountTL, order });
  }
  return out.length ? out : undefined;
};

const ensureSteps = (v: unknown): IRecipeStep[] | undefined => {
  const p = parseIfJson(v);
  if (!Array.isArray(p)) return undefined;
  const out: IRecipeStep[] = [];
  for (const it of p) {
    const textTL = ensureTL((it as any)?.text);
    if (!textTL) continue;
    const order = ensureNumber((it as any)?.order) ?? 1;
    out.push({ order, text: textTL });
  }
  return out.length ? out : undefined;
};

const ensureTips = (v: unknown): IRecipeTip[] | undefined => {
  const p = parseIfJson(v);
  if (!Array.isArray(p)) return undefined;
  const out: IRecipeTip[] = [];
  for (const it of p) {
    const textTL = ensureTL((it as any)?.text);
    if (!textTL) continue;
    const order = ensureNumber((it as any)?.order) ?? 1;
    out.push({ order, text: textTL });
  }
  return out.length ? out : undefined;
};

/** req.files için güvenli normalleştirici (array/fields/single) */
function getFilesFromRequest(req: Request): Express.Multer.File[] {
  const anyReq = req as any;
  const files = req.files;
  if (!files) return [];

  if (Array.isArray(files)) return files as Express.Multer.File[];

  if (typeof files === "object") {
    const candidates = [
      (files as Record<string, any>).images,
      (files as Record<string, any>)["images[]"],
      (files as Record<string, any>).file,
      (files as Record<string, any>)["file[]"],
    ].filter(Boolean);

    for (const c of candidates) {
      if (!c) continue;
      if (Array.isArray(c)) return c as Express.Multer.File[];
      if ((c as any)?.buffer || (c as any)?.path) return [c as Express.Multer.File];
    }
  }

  if (anyReq.file) return [anyReq.file as Express.Multer.File];
  return [];
}

/** file -> IRecipeImage (local/cloudinary) */
async function toRecipeImageFromFile(
  req: Request,
  f: Express.Multer.File
): Promise<IRecipeImage> {
  const provider = (process.env.STORAGE_PROVIDER || "local") as "local" | "cloudinary";

  if (provider === "cloudinary") {
    const publicId = (f as any).filename || (f as any).public_id;
    const url = (f as any).path || (publicId ? buildCloudinaryMainUrl(publicId) : "");
    const thumbnail = publicId ? buildCloudinaryThumbUrl(publicId) : url;
    const webp = publicId ? buildCloudinaryWebpUrl(publicId) : undefined;
    return { url, thumbnail, webp, publicId };
  }

  const url = buildLocalPublicUrl(f, "recipe", req);
  let thumbUrl = url;
  let webpUrl: string | undefined = undefined;

  if (shouldProcessImage()) {
    try {
      const res = await makeThumbAndWebp(f.path);
      if (res) {
        const ext = path.extname(url);
        const base = url.slice(0, -ext.length);
        thumbUrl = `${base}.thumb${ext}`;
        webpUrl = `${base}.webp`;
      }
    } catch {
      /* no-op */
    }
  }

  return { url, thumbnail: thumbUrl, webp: webpUrl };
}

/** body -> IRecipe (form-data aware) */
function buildRecipeBodyFromForm(b: any): Partial<IRecipe> {
  const out: Partial<IRecipe> = {};

  // NEW: slug'lar
  if (typeof b.slugCanonical === "string" && b.slugCanonical.trim() !== "") {
    out.slugCanonical = slugify(b.slugCanonical);
  }
  const slugTL = ensureSlugMap(b.slug);
  if (slugTL) out.slug = slugTL;

  // mevcut alanlar
  out.title = ensureTL(b.title);
  out.description = ensureTL(b.description);

  const tags = parseIfJson(b.tags);
  if (Array.isArray(tags)) {
    const clean = tags.map(ensureTL).filter((t): t is TranslatedLabel => !!t);
    if (clean.length) out.tags = clean;
  }

  if (b.category != null && String(b.category).trim() !== "") {
    const norm = normalizeCategoryKey(b.category);
    out.category = norm ?? String(b.category).trim().toLowerCase();
  }

  out.servings = ensureNumber(b.servings);
  out.prepMinutes = ensureNumber(b.prepMinutes);
  out.cookMinutes = ensureNumber(b.cookMinutes);
  out.totalMinutes = ensureNumber(b.totalMinutes);
  if (!out.totalMinutes && out.prepMinutes != null && out.cookMinutes != null) {
    out.totalMinutes = (out.prepMinutes || 0) + (out.cookMinutes || 0);
  }

  const difficulty = String(b.difficulty || "").trim();
  if (["easy", "medium", "hard"].includes(difficulty))
    out.difficulty = difficulty as IRecipe["difficulty"];

  const nutrition = parseIfJson(b.nutrition) as any;
  if (nutrition && typeof nutrition === "object") {
    out.nutrition = {
      calories: ensureNumber(nutrition.calories),
      protein: ensureNumber(nutrition.protein),
      carbs: ensureNumber(nutrition.carbs),
      fat: ensureNumber(nutrition.fat),
      fiber: ensureNumber(nutrition.fiber),
      sodium: ensureNumber(nutrition.sodium),
    };
  } else {
    const n: any = {};
    for (const k of ["calories", "protein", "carbs", "fat", "fiber", "sodium"] as const) {
      const v = ensureNumber((b as any)[k]);
      if (v != null) n[k] = v;
    }
    if (Object.keys(n).length) out.nutrition = n;
  }

  out.allergens = ensureStringArray(b.allergens);
  out.dietFlags = ensureDietFlags(b.dietFlags);
  out.allergenFlags = ensureAllergenFlagEnums(b.allergenFlags);

  const ingredients = ensureIngredients(b.ingredients);
  if (ingredients) out.ingredients = ingredients;

  const steps = ensureSteps(b.steps);
  if (steps) out.steps = steps;

  const tips = ensureTips(b.tips);
  if (tips) out.tips = tips;

  if (b.effectiveFrom) out.effectiveFrom = new Date(String(b.effectiveFrom));
  if (b.effectiveTo) out.effectiveTo = new Date(String(b.effectiveTo));

  const isPublished = ensureBoolean(b.isPublished);
  if (isPublished != null) out.isPublished = isPublished;
  const isActive = ensureBoolean(b.isActive);
  if (isActive != null) out.isActive = isActive;

  const order = ensureNumber(b.order);
  if (order != null) out.order = order;

  return out;
}

/* ===================== CRUD ===================== */

export async function list(req: Request, res: Response) {
  const { page = "1", limit = "20", q, status, tag, category } =
    req.query as Record<string, string>;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter: any = {};
  if (q && q.trim().length >= 2) filter.$text = { $search: q.trim() };
  if (status === "published") filter.isPublished = true;
  if (status === "draft") filter.isPublished = false;

  if (category && category.trim() !== "")
    filter.category = String(category).trim().toLowerCase();

  if (tag && tag.trim() !== "") {
    const tg = decodeURIComponent(tag).replace(/-/g, " ").trim();
    const esc = tg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(esc, "i");
    filter.$or = SUPPORTED_LOCALES.map((lng: string) => ({ [`tags.${lng}`]: rx }));
  }

  const [items, total] = await Promise.all([
    Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Recipe.countDocuments(filter),
  ]);

  res.json({ items, page: p, limit: l, total });
}

/** CREATE — multipart/form-data (images + fields) */
export async function create(req: Request, res: Response) {
  try {
    const data = buildRecipeBodyFromForm(req.body || {});
    const files = getFilesFromRequest(req);
    const newImages: IRecipeImage[] = [];
    for (const f of files) newImages.push(await toRecipeImageFromFile(req, f));

    const doc = await Recipe.create({ ...data, images: newImages });
    return res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error("[recipes.create] create error:", err);
    return sendSaveError(res, err, "RECIPE_CREATE_FAILED");
  }
}

export async function detail(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });
  const r = await Recipe.findById(id).lean();
  if (!r) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(r);
}

/** UPDATE — multipart/form-data (merge + add + remove + reorder) */
export async function update(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const body = req.body || {};
    const patch = buildRecipeBodyFromForm(body);

    if (patch.title)       doc.title = mergeTL(doc.title, patch.title)!;
    if (patch.description) doc.description = mergeTL(doc.description, patch.description)!;

    // NEW: slug ve slugCanonical
    if (patch.slug)               doc.slug = mergeTL(doc.slug, patch.slug)!;
    if (patch.slugCanonical !== undefined) doc.slugCanonical = patch.slugCanonical;

    const assignKeys: (keyof IRecipe)[] = [
      "category",
      "servings",
      "prepMinutes",
      "cookMinutes",
      "totalMinutes",
      "difficulty",
      "nutrition",
      "allergens",
      "dietFlags",
      "allergenFlags",
      "ingredients",
      "steps",
      "tips",
      "effectiveFrom",
      "effectiveTo",
      "isPublished",
      "isActive",
      "order",
      "tags",
    ];
    for (const k of assignKeys) {
      if ((patch as any)[k] !== undefined) (doc as any)[k] = (patch as any)[k];
    }

    // add images
    const files = getFilesFromRequest(req);
    if (files.length) {
      for (const f of files) {
        const one = await toRecipeImageFromFile(req, f);
        doc.images = doc.images || [];
        doc.images.push(one);
      }
      doc.markModified("images");
    }

    // remove images
    const rawRemoved = (body as any).removedImageKeys ?? (body as any)["removedImageKeys[]"];
    const parsedRemoved = parseIfJson<string[] | string>(rawRemoved);
    const removed: string[] = Array.isArray(parsedRemoved)
      ? parsedRemoved.map((x) => String(x))
      : typeof parsedRemoved === "string" && parsedRemoved
      ? [parsedRemoved]
      : [];

    if (removed.length && Array.isArray(doc.images)) {
      const provider = (process.env.STORAGE_PROVIDER || "local") as "local" | "cloudinary";
      const keys = new Set(removed.map((s) => String(s)));
      const keep: IRecipeImage[] = [];

      for (const img of doc.images) {
        const key = img.publicId || img.url;
        if (key && keys.has(String(key))) {
          try {
            if (provider === "cloudinary" && img.publicId) {
              await deleteUploadedFilesCloudinary([img.publicId]);
            } else {
              const paths = [img.url, img.thumbnail, img.webp].filter(Boolean) as string[];
              deleteUploadedFilesLocal(paths, "recipe");
            }
          } catch (e) {
            console.error("[recipes.update] remove image error:", e);
          }
        } else {
          keep.push(img);
        }
      }
      doc.images = keep;
      doc.markModified("images");
    }

    // reorder
    if ((body as any).existingImagesOrder) {
      try {
        const order = parseIfJson<string[]>((body as any).existingImagesOrder);
        if (Array.isArray(order) && order.length && Array.isArray(doc.images)) {
          const map = new Map<string, IRecipeImage>();
          for (const img of doc.images)
            map.set(String(img.publicId || img.url), img);
          const next: IRecipeImage[] = [];
          for (const k of order) {
            const hit = map.get(String(k));
            if (hit) {
              next.push(hit);
              map.delete(String(k));
            }
          }
          doc.images = [...next, ...Array.from(map.values())];
          doc.markModified("images");
        }
      } catch {}
    }

    await doc.save();
    return res.json(doc.toObject());
  } catch (err) {
    console.error("[recipes.update] save error:", err);
    return sendSaveError(res, err, "RECIPE_UPDATE_FAILED");
  }
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { isPublished } = req.body as { isPublished: boolean };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const patch: any = {
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
    };
    const r = await Recipe.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!r) return res.status(404).json({ error: "NOT_FOUND" });
    return res.json({
      id: r._id,
      isPublished: r.isPublished,
      publishedAt: r.publishedAt,
    });
  } catch (err) {
    console.error("[recipes.updateStatus] error:", err);
    return sendSaveError(res, err, "STATUS_PATCH_FAILED");
  }
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const provider = (process.env.STORAGE_PROVIDER || "local") as "local" | "cloudinary";

    try {
      if (provider === "cloudinary") {
        const pids = (doc.images || [])
          .map((i) => i.publicId)
          .filter(Boolean) as string[];
        if (pids.length) await deleteUploadedFilesCloudinary(pids);
      } else {
        const urls = (doc.images || [])
          .flatMap((i) => [i.url, i.thumbnail, i.webp])
          .filter(Boolean) as string[];
        if (urls.length) deleteUploadedFilesLocal(urls, "recipe");
      }
    } catch (e) {
      console.error("[recipes.remove] media delete error:", e);
    }

    await doc.deleteOne();
    return res.status(204).end();
  } catch (err) {
    console.error("[recipes.remove] delete error:", err);
    return sendSaveError(res, err, "RECIPE_DELETE_FAILED");
  }
}

/* ===================== MEDIA ===================== */

export async function addImages(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const files = getFilesFromRequest(req);
    if (!files.length) return res.status(400).json({ error: "NO_FILES" });

    const added: IRecipeImage[] = [];
    for (const f of files) {
      const one = await toRecipeImageFromFile(req, f);
      doc.images = doc.images || [];
      doc.images.push(one);
      added.push(one);
    }

    doc.markModified("images");
    await doc.save();
    return res.json({ ok: true, added, images: doc.images });
  } catch (err) {
    console.error("[recipes.addImages] save error:", err);
    return sendSaveError(res, err, "ADD_IMAGES_FAILED");
  }
}

export async function removeImage(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const idx = (doc.images || []).findIndex(
      (img) =>
        img.publicId === publicId ||
        path.basename(img.url) === publicId ||
        img.url === publicId
    );
    if (idx === -1) return res.status(404).json({ error: "IMAGE_NOT_FOUND" });

    const img = doc.images[idx];
    const provider = (process.env.STORAGE_PROVIDER || "local") as "local" | "cloudinary";

    try {
      if (provider === "cloudinary") {
        if (img.publicId) await deleteUploadedFilesCloudinary([img.publicId]);
      } else {
        const paths = [img.url, img.thumbnail, img.webp].filter(Boolean) as string[];
        deleteUploadedFilesLocal(paths, "recipe");
      }
    } catch (e) {
      console.error("[recipes.removeImage] delete error:", e);
    }

    doc.images.splice(idx, 1);
    doc.markModified("images");

    await doc.save();
    return res.status(204).end();
  } catch (err) {
    console.error("[recipes.removeImage] save error:", err);
    return sendSaveError(res, err, "REMOVE_IMAGE_FAILED");
  }
}

export async function updateImageMeta(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const { alt, source } = (req.body || {}) as {
      alt?: TranslatedLabel | string;
      source?: string;
    };

    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const image = (doc.images || []).find(
      (img) =>
        img.publicId === publicId ||
        path.basename(img.url) === publicId ||
        img.url === publicId
    );
    if (!image) return res.status(404).json({ error: "IMAGE_NOT_FOUND" });

    const altTL = ensureTL(alt);
    if (altTL) image.alt = altTL;
    if (typeof source === "string") image.source = source.trim() || undefined;

    doc.markModified("images");
    await doc.save();
    return res.json({ ok: true, image });
  } catch (err) {
    console.error("[recipes.updateImageMeta] save error:", err);
    return sendSaveError(res, err, "IMAGE_META_UPDATE_FAILED");
  }
}

export async function reorderImages(req: Request, res: Response) {
  const { id } = req.params;
  const { order } = (req.body || {}) as { order?: string[] | string };

  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const arr = parseIfJson<string[] | string>(order);
    const list = Array.isArray(arr) ? arr : typeof arr === "string" && arr ? [arr] : [];
    if (!list.length) return res.status(400).json({ error: "INVALID_ORDER" });

    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const key = (img: IRecipeImage) => img.publicId || img.url;
    const map = new Map<string, IRecipeImage>();
    for (const img of doc.images || []) map.set(String(key(img)), img);

    const next: IRecipeImage[] = [];
    for (const k of list) {
      const hit = map.get(String(k));
      if (hit) {
        next.push(hit);
        map.delete(String(k));
      }
    }
    doc.images = [...next, ...Array.from(map.values())];
    doc.markModified("images");

    await doc.save();
    return res.json({ ok: true, images: doc.images });
  } catch (err) {
    console.error("[recipes.reorderImages] save error:", err);
    return sendSaveError(res, err, "REORDER_IMAGES_FAILED");
  }
}

export async function setCoverImage(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  try {
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

    const idx = (doc.images || []).findIndex(
      (img) =>
        img.publicId === publicId ||
        path.basename(img.url) === publicId ||
        img.url === publicId
    );
    if (idx === -1) return res.status(404).json({ error: "IMAGE_NOT_FOUND" });

    const [img] = doc.images.splice(idx, 1);
    doc.images.unshift(img);
    doc.markModified("images");

    await doc.save();
    return res.json({ ok: true, images: doc.images });
  } catch (err) {
    console.error("[recipes.setCoverImage] save error:", err);
    return sendSaveError(res, err, "SET_COVER_FAILED");
  }
}
