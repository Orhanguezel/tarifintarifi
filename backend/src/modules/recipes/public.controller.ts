// src/features/recipes/controller.public.ts
import type { Request, Response, NextFunction } from "express";
import { Recipe } from "./model";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

import {
  hardenTags,
  normalizeTagsLocalized,
  normalizeIngredients,
  normalizeStepsBase,
  difficultyFromTime,
  parseNutrition,
  sanitizeAllergenFlags,
  inferAllergenFlagsFromIngredients,
  reconcileDietFlagsWithAllergens,
  dropForbiddenTagTL,
  looseTagRegex,
} from "./utils/content";

import { emptyTranslatedLabel, normalizeTranslatedLabel, ensureRealTranslations,replaceClonedEnglish } from "./utils/i18n";
import { buildSlugPerLocale, pickCanonical } from "./utils/slug";
import { toStringArray, truthy, lines } from "./utils/parse";
import { normalizeCategoryKey } from "./categories";
import {
  translateToAllLocales,
  translateBatchToAllLocales,
  translateMissingLocales,
} from "@/services/translate.service";
import type { IRecipeTip, TranslatedLabel } from "./types";
import { setPublicCache } from "./utils/http";
import { buildRecipeJsonSysPromptBase } from "./utils/ai.prompts";
import {
  determineStepRangeByCategory,
  determineIngredientRangeByCategory,
  expandStepsIfTooShort,
  expandTagsIfTooShort,
  expandIngredientsIfTooShort,
  expandDescriptionIfTooShort,
} from "./utils/ai.refine";

// LLM
import { llmChat, extractJsonSafe, LLMError } from "@/services/llm.service";

/* ------------------ Helpers ------------------ */

// Grok öncelikli, 429’larda Groq’a düşen küçük yardımcı
const PRIMARY_PROVIDER = ((process.env.LLM_PROVIDER as "grok" | "groq") || "grok") as
  | "grok"
  | "groq";

async function callModelWithFallback(sys: string, user: string) {
  const primary = PRIMARY_PROVIDER;
  const secondary = primary === "grok" ? "groq" : "grok";
  const allowFallback = String(process.env.AI_FALLBACK_SECONDARY || "true") !== "false";

  try {
    return await llmChat({
      provider: primary,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      forceJson: true,
      maxRetries: 3,
    });
  } catch (e: any) {
    const msg = String(e?.message || "");
    const is429 = e?.status === 429 || /429|rate[_\s-]?limit/i.test(msg);
    if (is429 && allowFallback) {
      return await llmChat({
        provider: secondary,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        forceJson: true,
        maxRetries: 3,
      });
    }
    throw e;
  }
}

/* ------------------ Public: List/Search ----------------- */
export async function publicGetRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, tag, hl, maxTime, limit = "50", page = "1", fields, category } =
      req.query as Record<string, string>;

    const now = new Date();
    const filter: Record<string, any> = {
      isActive: true,
      isPublished: true,
      $and: [
        { $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: { $lte: now } }] },
        { $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: now } }] },
      ],
    };

    // Kategori
    const rawCat = String(category || "").trim().toLowerCase();
    const catKey = normalizeCategoryKey(rawCat);
    if (catKey) filter.category = catKey;
    else if (rawCat) filter.category = rawCat;

    const qx = (q || "").trim();

    const useText = !!qx && process.env.RECIPES_USE_TEXT_SEARCH !== "false" && qx.length >= 2;
    if (useText) {
      filter.$text = { $search: qx };
    } else if (qx) {
      filter.$or = [
        ...SUPPORTED_LOCALES.map((lng) => ({ [`slug.${lng}`]: { $regex: qx, $options: "i" } })),
        ...SUPPORTED_LOCALES.map((lng) => ({ [`title.${lng}`]: { $regex: qx, $options: "i" } })),
        ...SUPPORTED_LOCALES.map((lng) => ({ [`tags.${lng}`]: { $regex: qx, $options: "i" } })),
        { cuisines: { $regex: qx, $options: "i" } },
      ];
    }

    // TAG filtresi (hl > tag)
    const tgRaw = String(hl || tag || "").trim();
    if (tgRaw) {
      const base = decodeURIComponent(tgRaw).replace(/-/g, " ").trim();
      const rxMain = looseTagRegex(base);
      const folded = base.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
      const rxAlt = folded && folded !== base ? looseTagRegex(folded) : null;
      const orMain = SUPPORTED_LOCALES.map((lng) => ({ [`tags.${lng}`]: rxMain }));
      const orAlt  = rxAlt ? SUPPORTED_LOCALES.map((lng) => ({ [`tags.${lng}`]: rxAlt })) : [];
      filter.$and = [...(filter.$and || []), { $or: [...orMain, ...orAlt] }];
    }

    if (maxTime != null && String(maxTime).trim() !== "") {
      filter.totalMinutes = { $lte: Number(maxTime) };
    }

    const MAX_LIMIT = Math.min(Number(process.env.RECIPES_PUBLIC_LIST_MAX || 200), 1000);
    const lim = Math.max(1, Math.min(Number(limit) || 50, MAX_LIMIT));
    const pg = Math.max(1, Number(page) || 1);
    const skip = (pg - 1) * lim;

    const total = await Recipe.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / lim));

    let query = Recipe.find(filter)
      .sort(useText ? { score: { $meta: "textScore" }, order: 1, createdAt: -1 } : { order: 1, createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .lean();

    if (fields && String(fields).trim()) query = query.select(String(fields));

    const list = await query;

    setPublicCache(res);
    res.status(200).json({
      success: true,
      message: req.t?.("recipes.listFetched") || "OK",
      data: list,
      meta: {
        page: pg,
        limit: lim,
        total,
        totalPages,
        count: list.length,
        hasPrev: pg > 1,
        hasNext: pg < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}



/** GET /recipes/search?q=...&category=...&limit=10 */
export async function publicSearchSuggest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { q = "", category, limit = "10" } = req.query as Record<string, string>;

    const filter: any = { isActive: true, isPublished: true };

    const rawCat = String(category || "").trim().toLowerCase();
    const catKey = normalizeCategoryKey(rawCat);
    if (catKey) filter.category = catKey;
    else if (rawCat) filter.category = rawCat;

    const qx = String(q).trim();
    if (qx) {
      filter.$or = [
        ...SUPPORTED_LOCALES.map((lng) => ({ [`title.${lng}`]: { $regex: qx, $options: "i" } })),
        ...SUPPORTED_LOCALES.map((lng) => ({ [`slug.${lng}`]: { $regex: qx, $options: "i" } })),
      ];
    }

    const list = await Recipe.find(filter)
      .select("slug title totalMinutes nutrition category images.thumbnail")
      .limit(Math.min(Number(limit) || 10, 25))
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

/* ------------------ Public: Detail ------------------ */
export async function publicGetRecipeBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const now = new Date();

    const raw = String((req.params as any).slug || "");
    const slug = decodeURIComponent(raw).trim().toLowerCase();

    const hdrLang = String(
      (req.headers["x-lang"] || (req.headers["accept-language"] as string) || "")
    ).split(",")[0].trim().toLowerCase();

    const loc =
      (req.locale as SupportedLocale) ||
      ((SUPPORTED_LOCALES as readonly string[]).includes(hdrLang)
        ? (hdrLang as SupportedLocale)
        : "tr");

    const baseQ: any = {
      isActive: true,
      isPublished: true,
      $and: [
        { $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: { $lte: now } }] },
        { $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: now } }] },
      ],
    };

    const fields =
      "slug slugCanonical title description images cuisines tags category servings prepMinutes cookMinutes totalMinutes difficulty nutrition allergens allergenFlags dietFlags ingredients steps tips isActive isPublished publishedAt order createdAt updatedAt effectiveFrom effectiveTo";

    let doc =
      (await Recipe.findOne({ ...baseQ, slugCanonical: slug }).select(fields).lean()) ||
      (await Recipe.findOne({ ...baseQ, [`slug.${loc}`]: slug }).select(fields).lean());

    if (!doc) {
      const or = SUPPORTED_LOCALES.map((lng) => ({ [`slug.${lng}`]: slug }));
      doc = await Recipe.findOne({ ...baseQ, $or: or }).select(fields).lean();
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: req.t?.("errors.not_found") || "Not Found" });
    }

    setPublicCache(res);
    return res.status(200).json({ success: true, message: req.t?.("recipes.fetched") || "OK", data: doc });
  } catch (err) {
    next(err);
  }
}

// ------------------ Public: AI Generate ------------------
export async function aiGeneratePublic(req: Request, res: Response, _next: NextFunction) {
  try {
    const {
      lang: langRaw,
      cuisine,
      vegetarian,
      vegan,
      glutenFree,
      lactoseFree,
      servings,
      maxMinutes,
      includeIngredients,
      excludeIngredients,
      category,
      prompt,
    } = (req.body || {}) as Record<string, any>;

    const lang: SupportedLocale =
      (langRaw as SupportedLocale) || (req.locale as SupportedLocale) || "tr";

    const dietaryFlags: string[] = [];
    if (truthy(vegetarian)) dietaryFlags.push("vegetarian");
    if (truthy(vegan)) dietaryFlags.push("vegan");
    if (truthy(glutenFree)) dietaryFlags.push("gluten-free");
    if (truthy(lactoseFree)) dietaryFlags.push("lactose-free");

    const includeArr = toStringArray(includeIngredients);
    const excludeArr = toStringArray(excludeIngredients);

    const criteriaParts: string[] = [];
    if (cuisine) criteriaParts.push(`cuisine=${cuisine}`);
    if (category) criteriaParts.push(`category=${category}`);
    if (dietaryFlags.length) criteriaParts.push(`dietary=[${dietaryFlags.join(", ")}]`);
    if (servings != null && String(servings).trim() !== "") criteriaParts.push(`servings=${servings}`);
    if (maxMinutes != null && String(maxMinutes).trim() !== "") criteriaParts.push(`maxMinutes<=${maxMinutes}`);
    if (includeArr.length) criteriaParts.push(`include=[${includeArr.join(", ")}]`);
    if (excludeArr.length) criteriaParts.push(`exclude=[${excludeArr.join(", ")}]`);
    if (prompt && String(prompt).trim()) criteriaParts.push(`note=${String(prompt).trim()}`);

    const criteriaText = criteriaParts.join("; ");
    if (!criteriaText) {
      return res.status(422).json({ success: false, message: "recipes.error.promptInvalid" });
    }

    // ---- LLM generate (JSON beklenir) – tek provider kaynağı: AI_PROVIDER -> LLM_PROVIDER -> "groq"
    const sys = buildRecipeJsonSysPromptBase(lang);
    const user = `Criteria:\n${criteriaText}`;

    const provider = (process.env.AI_PROVIDER || process.env.LLM_PROVIDER || "groq").toLowerCase() as "groq" | "grok";
    const raw = await llmChat({
      provider,
      // model: boş bırakırsan llm.service.ts GROQ_MODEL/GROK_MODEL/env varsayılanlarını kullanır
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      forceJson: true,
      maxRetries: 3,
    });

    const d: any = extractJsonSafe(raw);

    // ---- Başlık & açıklama
   let title = normalizeTranslatedLabel(d.title || {}, { trim: true });
let description = normalizeTranslatedLabel(d.description || {}, { trim: true });

// ⬇️ 300–600 karakter zorlaması (yalnız baseLocale doldurulur)
description = await expandDescriptionIfTooShort(lang, description as any, {
  title: title as any,
  category: d.category || category || null,
  cuisines: Array.isArray(d.cuisines) ? d.cuisines : [],
  dietFlags: Array.isArray(d.dietFlags) ? d.dietFlags : [],
  maxMinutes: maxMinutes != null ? Number(maxMinutes) : undefined
});
 // (sonra auto çeviri varsa devam…)
const auto = process.env.RECIPES_AUTO_TRANSLATE !== "false";
if (auto) {
  title = (await translateMissingLocales(title as any)) as any;
  description = (await translateMissingLocales(description as any)) as any;
}

    // ---- Tagler
    let tags = normalizeTagsLocalized(d.tags || []);
    if (Array.isArray(tags)) {
      const tmp: TranslatedLabel[] = [];
      for (const t of tags) {
        const tl = normalizeTranslatedLabel(t as TranslatedLabel, { trim: true }) as any;
        const full = auto ? await translateMissingLocales(tl) : tl;
        const safe = dropForbiddenTagTL(full as any);
        if (safe) tmp.push(safe);
      }
      tags = tmp;
    }

    // ---- Malzemeler & adımlar (ilk normalize)
    let ingNorm: any[] = normalizeIngredients(d.ingredients) ?? [];
    let steps = normalizeStepsBase(d.steps, { ensureServeStep: false, maxSteps: 12 })!;

    // ---- Kategoriye göre min–max aralıkları
    const { min: minSteps, max: maxSteps } = determineStepRangeByCategory(d.category || category);
    const { min: minIngr, max: maxIngr } = determineIngredientRangeByCategory(d.category || category);

    // ---- ADIM genişletme
    if (steps.length < minSteps) {
      const expanded = await expandStepsIfTooShort(
        steps.map((s) => ({ order: s.order, text: s.text })),
        minSteps,
        maxSteps
      );
      steps = normalizeStepsBase(expanded, { ensureServeStep: false, maxSteps })!;
    }

    // ---- MALZEME genişletme
    if (ingNorm.length < minIngr) {
      const expandedIngr = await expandIngredientsIfTooShort(
        ingNorm.map((i) => ({ name: i.name, amount: i.amount, order: i.order })),
        minIngr,
        maxIngr,
        {
          title: title as any,
          description: description as any,
          cuisines: Array.isArray(d.cuisines) ? d.cuisines : cuisine ? [String(cuisine)] : [],
          category: d.category || category || null,
          include: includeArr,
          exclude: excludeArr,
          dietFlags: dietaryFlags,
        }
      );
      ingNorm = normalizeIngredients(expandedIngr) ?? ingNorm;
    }

    // ---- Çeviri tamamlama
    if (auto) {
      for (const st of steps) {
        (st as any).text = await translateMissingLocales(
          normalizeTranslatedLabel((st as any).text || {}, { trim: true }) as any
        );
      }
      for (const it of ingNorm) {
        (it as any).name = await translateMissingLocales(
          normalizeTranslatedLabel((it as any).name || {}, { trim: true }) as any
        );
        if ((it as any).amount) {
          (it as any).amount = await translateMissingLocales(
            normalizeTranslatedLabel((it as any).amount || {}, { trim: true }) as any
          );
        }
      }
    }

    // ---- İpuçları (tips)
    let tips: IRecipeTip[] = Array.isArray(d.tips)
      ? d.tips
          .map((t: any, i: number) => ({
            order: Number(t?.order ?? i + 1),
            text: normalizeTranslatedLabel((t?.text || {}) as TranslatedLabel, { trim: true }) as any
          }))
          .filter((x: any) => x.order > 0)
      : [];

    if (auto) {
      for (const tp of tips) {
        tp.text = await ensureRealTranslations(tp.text as any, lang);
        tp.text = await replaceClonedEnglish(tp.text as any);
      }
    } else {
      // auto=false: base dışındaki kopya metinleri boşalt → FE/BE fallback çalışsın
      for (const tp of tips) {
        const txt = tp.text as any;
        const baseVal = String(txt[lang] || "").trim();
        for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
          if (l !== lang && String(txt[l] || "").trim() === baseVal) txt[l] = "";
        }
        tp.text = txt;
      }
    }

    // En az 3 ipucu garantisi
    if (tips.length < 3) {
      const baseTips = [
        "Taste and adjust seasoning to your preference.",
        "Let the dish rest briefly to balance flavors.",
        "Garnish thoughtfully for aroma and texture.",
      ];
      for (let i = tips.length; i < 3; i++) {
        const textTL = auto
          ? await translateToAllLocales(baseTips[i - tips.length])
          : ({ [lang]: baseTips[i - tips.length] } as any);
        tips.push({ order: i + 1, text: textTL as any });
      }
    }

    // ---- Tag sayısı min 10 güvenliği
    if (Array.isArray(tags) && tags.length < 10) {
      const expandedTags = await expandTagsIfTooShort(tags as TranslatedLabel[], {
        title: title as any,
        description: description as any,
        cuisines: Array.isArray(d.cuisines) ? d.cuisines : cuisine ? [String(cuisine)] : [],
        category: d.category || category || null,
        dietFlags: dietaryFlags,
      });
      const norm = normalizeTagsLocalized(expandedTags);
      const tmp: TranslatedLabel[] = [];
      for (const t of norm) {
        const tl = normalizeTranslatedLabel(t as any, { trim: true }) as any;
        const full = auto ? await translateMissingLocales(tl) : tl;
        const safe = dropForbiddenTagTL(full as any);
        if (safe) tmp.push(safe);
      }
      tags = tmp;
    }

    // ---- Slug / cuisines / kategori
    const slugObj = buildSlugPerLocale(d.slug, title);
    const slugCanonical = pickCanonical(slugObj, title);
    let cuisines = Array.isArray(d.cuisines)
      ? d.cuisines.map((x: any) => String(x || "").trim()).filter(Boolean)
      : cuisine
      ? [String(cuisine).trim()]
      : [];
    const finalCategoryRaw = d.category ?? category ?? null;

    // ---- Süreler & besin
    const prepMinutes = d.prepMinutes != null ? Number(d.prepMinutes) : undefined;
    const cookMinutes = d.cookMinutes != null ? Number(d.cookMinutes) : undefined;
    let totalMinutes: number | undefined =
      d.totalMinutes != null
        ? Number(d.totalMinutes)
        : prepMinutes || cookMinutes
        ? Number(prepMinutes || 0) + Number(cookMinutes || 0)
        : undefined;

    if (maxMinutes != null && Number.isFinite(Number(maxMinutes))) {
      const cap = Number(maxMinutes);
      if (totalMinutes == null || totalMinutes > cap) totalMinutes = cap;
    }

    const nutrition = parseNutrition(d);

    // ---- Alerjen & diyet tutarlılığı
    const inferred = new Set(inferAllergenFlagsFromIngredients(ingNorm));
    const givenAllergenFlags = sanitizeAllergenFlags(d.allergenFlags);
    const allergenFlags = Array.from(new Set([...(givenAllergenFlags || []), ...inferred]));
    const dietFlags = reconcileDietFlagsWithAllergens(dietaryFlags, new Set(allergenFlags), ingNorm);

    // ---- Son tag normalize + forbidden filtre
    tags = (normalizeTagsLocalized(hardenTags(tags || [])) || [])
      .map((t: any) => dropForbiddenTagTL(t))
      .filter(Boolean) as any;

    // ---- ORDER: max(order)+1
    let nextOrder = 1;
    try {
      const last = await Recipe.find().select("order").sort({ order: -1 }).limit(1).lean();
      nextOrder = Math.max(0, Number(last?.[0]?.order || 0)) + 1;
    } catch { nextOrder = 1; }

    const doc = await Recipe.create({
      slug: slugObj,
      slugCanonical,
      order: nextOrder,
      title,
      description,
      images: [],
      category: finalCategoryRaw,
      cuisines,
      tags,
      servings:
        d.servings != null ? Number(d.servings) : servings != null ? Number(servings) : undefined,
      prepMinutes,
      cookMinutes,
      totalMinutes,
      difficulty: difficultyFromTime(totalMinutes),
      nutrition,
      dietFlags,
      allergenFlags,
      ingredients: ingNorm,
      steps,
      tips,
      isPublished: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      data: doc.toJSON(),
      message: req.t?.("ai.generated") || "Generated",
    });
  } catch (err: any) {
    const isDebug = String(process.env.AI_DEBUG_ERRORS || "").toLowerCase() === "true";
    const msg = String(err?.message || "");
    const status = Number(err?.status || 0);

    // Rate limit (429) → Retry-After ile dön
    if (status === 429 || /429|rate[_\s-]?limit/i.test(msg)) {
      res.setHeader("Retry-After", String(process.env.AI_GEN_RETRY_AFTER_SEC || 20));
      return res.status(429).json({
        success: false,
        message: req.t?.("ai.rate_limit") || "AI hizmeti yoğun. Lütfen kısa bir süre sonra tekrar deneyin.",
        ...(isDebug ? { details: msg } : {}),
      });
    }

    // Diğer hatalar (auth/model/network vs.) → 503 + isteğe bağlı detay
    const base = req.t?.("ai.unavailable") || "AI hizmeti geçici olarak kullanılamıyor. Lütfen tekrar deneyin.";
    const details =
      err instanceof LLMError
        ? [err.provider, err.status, err.code, err.message].filter(Boolean).join(" | ")
        : msg;

    return res.status(503).json({
      success: false,
      message: base,
      ...(isDebug ? { details } : {}),
    });
  }
}
/* --------------- Public: Manual Submit (Form) --------------- */
export async function publicSubmitRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const b = (req.body || {}) as Record<string, any>;

    const titleStr = String(b.title || "").trim();
    if (!titleStr || titleStr.length < 3) {
      return res
        .status(400)
        .json({ success: false, message: "title is required (min 3 chars)" });
    }

    const mins = Number(b.totalMinutes);
    const auto = process.env.RECIPES_AUTO_TRANSLATE !== "false";

    // Title & Description
    const titleTL = auto ? await translateToAllLocales(titleStr) : ({ tr: titleStr } as any);
    const descTL = b.description
      ? (auto
          ? await translateToAllLocales(String(b.description).trim())
          : ({ tr: String(b.description).trim() } as any))
      : emptyTranslatedLabel();

    // Ingredients & Steps (line-by-line)
    const ingLines = lines(String(b.ingredientsText || ""));
    const stpLines = lines(String(b.stepsText || ""));

    let ingredients: any[] = [];
    let steps: any[] = [];

    if (auto) {
      const ingItems = ingLines.map((t, i) => ({ key: `ing_${i + 1}`, text: t }));
      const stpItems = stpLines.map((t, i) => ({ key: `step_${i + 1}`, text: t }));
      const ingTLMap = await translateBatchToAllLocales(ingItems, { keepNumbersUnits: true });
      const stpTLMap = await translateBatchToAllLocales(stpItems);
      ingredients = ingLines.map((_, i) => ({ order: i, name: ingTLMap[`ing_${i + 1}`] }));
      steps = stpLines.map((_, i) => ({ order: i + 1, text: stpTLMap[`step_${i + 1}`] }));
    } else {
      ingredients = ingLines.map((t, i) => ({ name: { tr: t }, order: i }));
      steps = stpLines.map((t, i) => ({ order: i + 1, text: { tr: t } }));
    }

    // Tips
    const tipLines = lines(String(b.tipsText || ""));
    let tips: IRecipeTip[] = [];
    if (tipLines.length) {
      if (auto) {
        const tipItems = tipLines.map((t, i) => ({ key: `tip_${i + 1}`, text: t }));
        const tipTLMap = await translateBatchToAllLocales(tipItems);
        tips = tipLines.map((_, i) => ({ order: i + 1, text: tipTLMap[`tip_${i + 1}`] as any }));
      } else {
        tips = tipLines.map((t, i) => ({ order: i + 1, text: { tr: t } as any }));
      }
    }

    // Slug
    const slugObj = buildSlugPerLocale({}, titleTL as any);
    const slugCanonical = pickCanonical(slugObj, titleTL as any);

    // Images
    const imgNorm = Array.isArray(b.images)
      ? b.images
          .filter((x) => x?.url && x?.thumbnail)
          .map((x) => ({
            url: String(x.url),
            thumbnail: String(x.thumbnail),
            webp: x.webp ? String(x.webp) : undefined,
            publicId: x.publicId ? String(x.publicId) : undefined,
            alt: x.alt && typeof x.alt === "object" ? x.alt : { tr: titleStr },
            source: x.source ? String(x.source) : undefined,
          }))
      : [];

    // Cuisines & Tags
    const cuisinesNorm = Array.isArray(b.cuisines)
      ? b.cuisines.map((c) => String(c).trim()).filter(Boolean)
      : [];
    const tagsNorm = Array.isArray(b.tags)
      ? b.tags.map((t) => ({ tr: String(t).trim() })).filter((t) => !!t.tr)
      : [];

    // Allergen & diet tutarlılığı
    const inferred = new Set(inferAllergenFlagsFromIngredients(ingredients));
    const givenAllergenFlags = sanitizeAllergenFlags(b.allergenFlags);
    const allergenFlags = Array.from(new Set([...(givenAllergenFlags || []), ...inferred]));
    const givenDiet = Array.isArray(b.dietFlags) ? b.dietFlags : undefined;
    const dietFlags = reconcileDietFlagsWithAllergens(
      givenDiet as any,
      new Set(allergenFlags),
      ingredients
    );

    // ORDER: max(order)+1
    let nextOrder = 1;
    try {
      const last = await Recipe.find().select("order").sort({ order: -1 }).limit(1).lean();
      nextOrder = Math.max(0, Number(last?.[0]?.order || 0)) + 1;
    } catch {
      nextOrder = 1;
    }

    const doc = await Recipe.create({
      slug: slugObj,
      slugCanonical,
      order: nextOrder,
      title: titleTL,
      description: descTL,
      images: imgNorm,
      category: b.category != null ? String(b.category).trim() : null,
      cuisines: cuisinesNorm,
      tags: normalizeTagsLocalized(hardenTags(tagsNorm as any)),
      servings: b.servings != null ? Number(b.servings) : undefined,
      totalMinutes: Number.isFinite(mins) ? mins : undefined,
      difficulty: difficultyFromTime(mins),
      nutrition: parseNutrition(b.nutrition || { calories: b.calories }),
      allergens: Array.isArray(b.allergens)
        ? b.allergens.map((x: any) => String(x).toLowerCase().trim()).filter(Boolean)
        : undefined,
      dietFlags,
      allergenFlags,
      ingredients,
      steps,
      tips,
      isPublished: true,
      isActive: true,
    });

    res
      .status(201)
      .json({ success: true, message: "recipe.submitted", data: doc.toJSON() });
  } catch (err) {
    next(err);
  }
}
