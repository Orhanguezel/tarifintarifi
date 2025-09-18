// src/modules/recipes/admin.controller.ts
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
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

import { getTenantSlug } from "@/middleware/uploadMiddleware";
import {
  deleteUploadedFilesLocal,
  deleteUploadedFilesCloudinary,
} from "@/utils/deleteUploadedFiles";
import { normalizeCategoryKey } from "./categories";

/* ================= helpers (form-data aware) ================= */

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
  if (Array.isArray(parsed)) {
    return parsed.map(String).filter((x) => x.trim() !== "");
  }
  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
};

/* ---- enum-safe flag normalizers (union tiplerine uygun) ---- */
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

function ensureEnumFlags<T extends string>(
  v: unknown,
  allowed: readonly T[]
): T[] | undefined {
  const arr = ensureStringArray(v);
  if (!arr) return undefined;
  const set = new Set(arr.map((s) => s.toLowerCase()));
  const res = allowed.filter((a) => set.has(String(a))) as T[];
  return res.length ? res : [];
}

const ensureDietFlags = (v: unknown): DietFlag[] | undefined =>
  ensureEnumFlags<DietFlag>(v, DIET_FLAGS);

const ensureAllergenFlagEnums = (
  v: unknown
): AllergenFlag[] | undefined => ensureEnumFlags<AllergenFlag>(v, ALLERGEN_FLAGS);

/* ---- content arrays: type-safe dönüş ---- */
const ensureIngredients = (
  v: unknown
): IRecipeIngredient[] | undefined => {
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
    if (!textTL) continue; // text artık asla undefined değil
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
    if (!textTL) continue; // text artık asla undefined değil
    const order = ensureNumber((it as any)?.order) ?? 1;
    out.push({ order, text: textTL });
  }
  return out.length ? out : undefined;
};

/** Görsel dosyasını model alanına çevirir (local veya cloudinary) */
async function toRecipeImageFromFile(
  req: Request,
  f: Express.Multer.File
): Promise<IRecipeImage> {
  const provider = (process.env.STORAGE_PROVIDER || "local") as
    | "local"
    | "cloudinary";

  if (provider === "cloudinary") {
    const publicId = (f as any).filename || (f as any).public_id;
    const url =
      (f as any).path || (publicId ? buildCloudinaryMainUrl(publicId) : "");
    const thumbnail = publicId ? buildCloudinaryThumbUrl(publicId) : url;
    const webp = publicId ? buildCloudinaryWebpUrl(publicId) : undefined;
    return { url, thumbnail, webp, publicId };
  }

  // local
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
      /* ignore */
    }
  }

  return { url, thumbnail: thumbUrl, webp: webpUrl };
}

/** body -> IRecipe alanlarını form-data uyumlu toplar */
function buildRecipeBodyFromForm(b: any): Partial<IRecipe> {
  const out: Partial<IRecipe> = {};

  out.title = ensureTL(b.title);
  out.description = ensureTL(b.description);

  // Çok dilli tags (TranslatedLabel[])
  const tags = parseIfJson(b.tags);
  if (Array.isArray(tags)) {
    const clean = tags
      .map(ensureTL)
      .filter((t): t is TranslatedLabel => !!t);
    if (clean.length) out.tags = clean;
  }

  // kategori normalize
  if (b.category != null && String(b.category).trim() !== "") {
    const norm = normalizeCategoryKey(b.category);
    out.category = norm ?? String(b.category).trim().toLowerCase();
  }

  out.servings = ensureNumber(b.servings);
  out.prepMinutes = ensureNumber(b.prepMinutes);
  out.cookMinutes = ensureNumber(b.cookMinutes);
  out.totalMinutes = ensureNumber(b.totalMinutes);
  if (
    !out.totalMinutes &&
    out.prepMinutes != null &&
    out.cookMinutes != null
  ) {
    out.totalMinutes = (out.prepMinutes || 0) + (out.cookMinutes || 0);
  }

  const difficulty = String(b.difficulty || "").trim();
  if (["easy", "medium", "hard"].includes(difficulty))
    out.difficulty = difficulty as IRecipe["difficulty"];

  // Nutrition — obje ya da tek tek alanlar
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

  // flags
  out.allergens = ensureStringArray(b.allergens); // serbest liste
  out.dietFlags = ensureDietFlags(b.dietFlags); // DietFlag[]
  out.allergenFlags = ensureAllergenFlagEnums(b.allergenFlags); // AllergenFlag[]

  // içerik
  const ingredients = ensureIngredients(b.ingredients);
  if (ingredients) out.ingredients = ingredients;

  const steps = ensureSteps(b.steps);
  if (steps) out.steps = steps;

  const tips = ensureTips(b.tips);
  if (tips) out.tips = tips;

  // zaman penceresi
  if (b.effectiveFrom) out.effectiveFrom = new Date(String(b.effectiveFrom));
  if (b.effectiveTo) out.effectiveTo = new Date(String(b.effectiveTo));

  // yayın/durum
  const isPublished = ensureBoolean(b.isPublished);
  if (isPublished != null) out.isPublished = isPublished;
  const isActive = ensureBoolean(b.isActive);
  if (isActive != null) out.isActive = isActive;

  // order
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
    filter.$or = [
      { "tags.tr": rx },
      { "tags.en": rx },
      { "tags.de": rx },
      { "tags.fr": rx },
      { "tags.es": rx },
      { "tags.ru": rx },
      { "tags.ar": rx },
      { "tags.pl": rx },
    ];
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

/** CREATE — multipart/form-data (images + alanlar) */
export async function create(req: Request, res: Response) {
  const data = buildRecipeBodyFromForm(req.body || {});
  const files = Array.isArray(req.files)
    ? (req.files as Express.Multer.File[])
    : [];
  const newImages: IRecipeImage[] = [];

  for (const f of files) {
    newImages.push(await toRecipeImageFromFile(req, f));
  }

  const doc = await Recipe.create({
    ...data,
    images: newImages,
  });

  res.status(201).json({ id: doc._id });
}

export async function detail(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });
  const r = await Recipe.findById(id).lean();
  if (!r) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(r);
}

/** UPDATE — multipart/form-data (alan merge + yeni görseller + silme + reorder) */
export async function update(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  const doc = await Recipe.findById(id);
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  const body = req.body || {};
  const patch = buildRecipeBodyFromForm(body);

  // TL alanları merge
  if (patch.title) doc.title = mergeTL(doc.title, patch.title)!;
  if (patch.description)
    doc.description = mergeTL(doc.description, patch.description)!;

  // basit alanlar
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

  // Yeni görseller (form-data)
  const files = Array.isArray(req.files)
    ? (req.files as Express.Multer.File[])
    : [];
  if (files.length) {
    for (const f of files) {
      const one = await toRecipeImageFromFile(req, f);
      doc.images = doc.images || [];
      doc.images.push(one);
    }
  }

  // Görsel silme: body.removedImageKeys → string | string[] (publicId veya url)
  const rawRemoved =
    (body as any).removedImageKeys ?? (body as any)["removedImageKeys[]"];
  const removed: string[] = Array.isArray(rawRemoved)
    ? rawRemoved.map((x: any) => String(x))
    : typeof rawRemoved === "string" && rawRemoved
    ? [rawRemoved]
    : [];
  if (removed.length && Array.isArray(doc.images)) {
    const provider = (process.env.STORAGE_PROVIDER || "local") as
      | "local"
      | "cloudinary";
    const keys = new Set(removed.map((s) => String(s)));
    const keep: IRecipeImage[] = [];
    for (const img of doc.images) {
      const key = img.publicId || img.url;
      if (key && keys.has(String(key))) {
        try {
          if (provider === "cloudinary" && img.publicId) {
            await cloudinary.uploader.destroy(img.publicId);
          } else {
            const tenant = getTenantSlug(req);
            deleteUploadedFilesLocal([img.url], "recipe", tenant);
          }
        } catch {}
      } else {
        keep.push(img);
      }
    }
    doc.images = keep;
  }

  // Reorder: body.existingImagesOrder → string[]
  if ((body as any).existingImagesOrder) {
    try {
      const order = parseIfJson<string[]>(
        (body as any).existingImagesOrder
      );
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
      }
    } catch {}
  }

  await doc.save();
  res.json(doc.toObject());
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { isPublished } = req.body as { isPublished: boolean };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  const patch: any = {
    isPublished: !!isPublished,
    publishedAt: isPublished ? new Date() : null,
  };
  const r = await Recipe.findByIdAndUpdate(id, patch, {
    new: true,
  }).lean();
  if (!r) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({
    id: r._id,
    isPublished: r.isPublished,
    publishedAt: r.publishedAt,
  });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });
  const doc = await Recipe.findById(id);
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  const provider = (process.env.STORAGE_PROVIDER || "local") as
    | "local"
    | "cloudinary";
  if (provider === "cloudinary") {
    const pids = (doc.images || [])
      .map((i) => i.publicId)
      .filter(Boolean) as string[];
    await deleteUploadedFilesCloudinary(pids);
  } else {
    const tenant = getTenantSlug(req);
    const urls = (doc.images || [])
      .map((i) => i.url)
      .filter(Boolean) as string[];
    deleteUploadedFilesLocal(urls, "recipe", tenant);
  }

  await doc.deleteOne();
  res.status(204).end();
}

/* ===================== MEDIA ===================== */

export async function addImages(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });
  const doc = await Recipe.findById(id);
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  const files = Array.isArray(req.files)
    ? (req.files as Express.Multer.File[])
    : [];
  if (!files.length) return res.status(400).json({ error: "NO_FILES" });

  const added: IRecipeImage[] = [];
  for (const f of files) {
    const one = await toRecipeImageFromFile(req, f);
    doc.images = doc.images || [];
    doc.images.push(one);
    added.push(one);
  }

  await doc.save();
  res.json({ ok: true, added, images: doc.images });
}

export async function removeImage(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  const doc = await Recipe.findById(id);
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  const idx = (doc.images || []).findIndex(
    (img) =>
      img.publicId === publicId ||
      path.basename(img.url) === publicId ||
      img.url === publicId
  );
  if (idx === -1)
    return res.status(404).json({ error: "IMAGE_NOT_FOUND" });

  const img = doc.images[idx];
  const provider = (process.env.STORAGE_PROVIDER || "local") as
    | "local"
    | "cloudinary";

  try {
    if (provider === "cloudinary") {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    } else {
      const tenant = getTenantSlug(req);
      deleteUploadedFilesLocal([img.url], "recipe", tenant);
    }
  } catch {}

  doc.images.splice(idx, 1);
  await doc.save();
  res.status(204).end();
}

export async function updateImageMeta(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

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

  await doc.save();
  res.json({ ok: true, image });
}

export async function reorderImages(req: Request, res: Response) {
  const { id } = req.params;
  const { order } = (req.body || {}) as { order?: string[] | string };

  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  const arr = parseIfJson<string[] | string>(order);
  const list = Array.isArray(arr)
    ? arr
    : typeof arr === "string" && arr
    ? [arr]
    : [];
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

  await doc.save();
  res.json({ ok: true, images: doc.images });
}

export async function setCoverImage(req: Request, res: Response) {
  const { id, publicId } = req.params as { id: string; publicId: string };
  if (!Types.ObjectId.isValid(id))
    return res.status(404).json({ error: "NOT_FOUND" });

  const doc = await Recipe.findById(id);
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  const idx = (doc.images || []).findIndex(
    (img) =>
      img.publicId === publicId ||
      path.basename(img.url) === publicId ||
      img.url === publicId
  );
  if (idx === -1)
    return res.status(404).json({ error: "IMAGE_NOT_FOUND" });

  const [img] = doc.images.splice(idx, 1);
  doc.images.unshift(img);

  await doc.save();
  res.json({ ok: true, images: doc.images });
}
