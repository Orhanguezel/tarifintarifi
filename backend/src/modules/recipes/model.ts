import { Schema, model, models, type Model } from "mongoose";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type {
  IRecipe,
  IRecipeImage,
  IRecipeIngredient,
  IRecipeStep,
  IRecipeTip,
  TranslatedLabel,
  ReactionTotals
} from "./types";
import { localizedStringField } from "./utils/i18n";
import { buildSlugPerLocale, pickCanonical } from "./utils/slug";
import { stringifyIdsDeep } from "./utils/parse";
import { normalizeCategoryKey } from "./categories";

/* ---------- Sub Schemas (multilingual) ---------- */
const RecipeImageSchema = new Schema<IRecipeImage>(
  {
    url: { type: String, required: true, trim: true },
    thumbnail: { type: String, required: true, trim: true },
    webp: { type: String, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: Object, default: undefined },
    source: { type: String, trim: true }
  },
  { _id: false, strict: false }
);

const IngredientSchema = new Schema<IRecipeIngredient>(
  {
    name: { type: Object, required: true, default: undefined },
    amount: { type: Object, default: undefined },
    order: { type: Number, min: 0, max: 100000, default: 0 }
  },
  { _id: false, strict: false }
);

const StepSchema = new Schema<IRecipeStep>(
  {
    order: { type: Number, required: true, min: 1, max: 100000 },
    text: { type: Object, required: true, default: undefined }
  },
  { _id: false, strict: false }
);

const TipSchema = new Schema<IRecipeTip>(
  {
    order: { type: Number, required: true, min: 1, max: 100000 },
    text: { type: Object, required: true, default: undefined }
  },
  { _id: false, strict: false }
);

/** Tags are multilingual objects */
const TagSchema = new Schema<Record<SupportedLocale, string>>(
  localizedStringField(),
  { _id: false, strict: false }
);

const NutritionSchema = new Schema(
  {
    calories: { type: Number, min: 0 },
    protein:  { type: Number, min: 0 },
    carbs:    { type: Number, min: 0 },
    fat:      { type: Number, min: 0 },
    fiber:    { type: Number, min: 0 },
    sodium:   { type: Number, min: 0 }
  },
  { _id: false }
);

const ReactionTotalsSchema = new Schema<ReactionTotals>(
  {
    like: { type: Number, default: 0, min: 0 },
    love: { type: Number, default: 0, min: 0 },
    yum:  { type: Number, default: 0, min: 0 },
    wow:  { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

/* ---------- Recipe Schema ---------- */
const RecipeSchema = new Schema<IRecipe>(
  {
    slugCanonical: { type: String, required: true, trim: true, lowercase: true },
    slug:          { type: Object, required: true, default: undefined },

    order: { type: Number, default: 0, min: 0, max: 100000, index: true },

    title:       { type: Object, required: true, default: undefined },
    description: { type: Object, default: undefined },

    images: { type: [RecipeImageSchema], default: [] },

    cuisines: [{ type: String, trim: true }],
    tags:     { type: [TagSchema], default: [] },

    // Dinamik kategori + normalize
    category: {
      type: String,
      trim: true,
      index: true,
      default: null,
      set: (v: any) => {
        const norm = normalizeCategoryKey(v);
        if (norm) return norm;                       // sabit anahtar
        const s = String(v ?? "").trim().toLowerCase();
        return s || null;                            // dinamikse ham string (lc)
      },
    },

    servings:     { type: Number, min: 1 },
    prepMinutes:  { type: Number, min: 0 },
    cookMinutes:  { type: Number, min: 0 },
    totalMinutes: { type: Number, min: 0 },
    difficulty:   { type: String, enum: ["easy", "medium", "hard"], default: "easy", index: true },

    nutrition: { type: NutritionSchema, default: undefined },

    /** Geriye dönük: serbest metin + yapılandırılmış bayraklar */
    allergens:     [{ type: String, trim: true, lowercase: true }],
    dietFlags:     [{ type: String, trim: true, lowercase: true, enum: ["vegetarian","vegan","gluten-free","lactose-free"] }],
    allergenFlags: [{ type: String, trim: true, lowercase: true, enum: ["gluten","dairy","egg","nuts","peanut","soy","sesame","fish","shellfish"] }],

    ratingAvg:     { type: Number, min: 0, max: 5, default: 0, index: true },
    ratingCount:   { type: Number, min: 0, default: 0 },
    commentCount:  { type: Number, min: 0, default: 0 },
    reactionTotals:{ type: ReactionTotalsSchema, default: () => ({}) },

    similarRecipes: [{ type: Schema.Types.ObjectId, ref: "recipe" }],

    ingredients: { type: [IngredientSchema], default: [] },
    steps:       { type: [StepSchema], default: [] },
    tips:        { type: [TipSchema], default: [] },

    effectiveFrom: { type: Date },
    effectiveTo:   { type: Date },

    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: null },
    isActive:    { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
RecipeSchema.index({ slugCanonical: 1 }, { unique: true, name: "slug_canonical_unique" });

for (const l of SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>) {
  RecipeSchema.index({ [`slug.${l}`]: 1 }, { name: `slug_${l}_idx` });
}

for (const l of SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>) {
  RecipeSchema.index({ [`tags.${l}`]: 1 }, { name: `tags_${l}_idx` });
}

RecipeSchema.index(
  { isActive: 1, isPublished: 1, effectiveFrom: 1, effectiveTo: 1 },
  { name: "pub_window_idx" }
);
RecipeSchema.index({ totalMinutes: 1 }, { name: "time_filter_idx" });
RecipeSchema.index({ ratingAvg: -1, ratingCount: -1 }, { name: "rating_sort_idx" });

// Çok dilli metin text index
{
  const textIdx: Record<string, "text"> = {};
  for (const lng of SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>) {
    textIdx[`title.${lng}`] = "text";
    textIdx[`description.${lng}`] = "text";
    textIdx[`tags.${lng}`] = "text";
  }
  RecipeSchema.index(textIdx, { name: "recipe_text_search", default_language: "none" });
}

/* ---------- Slug normalize ---------- */
RecipeSchema.pre("validate", function (next) {
  const anyThis = this as any;

  anyThis.slug = buildSlugPerLocale(anyThis.slug as TranslatedLabel, anyThis.title as TranslatedLabel);
  anyThis.slugCanonical = pickCanonical(anyThis.slug as TranslatedLabel, anyThis.title as TranslatedLabel);

  for (const l of SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>) {
    const v = String(anyThis.slug?.[l] || "").trim();
    if (!v) anyThis.slug[l] = anyThis.slugCanonical;
  }
  next();
});

RecipeSchema.pre("save", function (next) {
  const anyThis = this as any;

  if (anyThis.effectiveFrom && anyThis.effectiveTo && anyThis.effectiveFrom > anyThis.effectiveTo) {
    anyThis.effectiveTo = undefined;
  }

  if (anyThis.totalMinutes == null) {
    anyThis.totalMinutes =
      (Number(anyThis.prepMinutes) || 0) + (Number(anyThis.cookMinutes) || 0);
  }

  if (anyThis.isPublished && !anyThis.publishedAt) {
    anyThis.publishedAt = new Date();
  }
  if (!anyThis.isPublished) {
    anyThis.publishedAt = null;
  }

  if (anyThis.ratingAvg != null) {
    anyThis.ratingAvg = Math.max(0, Math.min(5, Number(anyThis.ratingAvg)));
  }
  next();
});

/* ---------- Virtuals (backward compat) ---------- */
RecipeSchema.virtual("calories")
  .get(function (this: any) {
    return this.nutrition?.calories;
  })
  .set(function (this: any, v: any) {
    if (!this.nutrition) this.nutrition = {};
    const num = Number(v);
    if (Number.isFinite(num)) this.nutrition.calories = num;
  });

/* ---------- toJSON / toObject (ObjectId -> string) ---------- */
const transform = (_: any, ret: any) => stringifyIdsDeep(ret);
RecipeSchema.set("toJSON",  { virtuals: true, versionKey: false, transform });
RecipeSchema.set("toObject",{ virtuals: true, versionKey: false, transform });

/* ---------- Exports ---------- */
export const Recipe: Model<IRecipe> =
  (models.recipe as Model<IRecipe>) || model<IRecipe>("recipe", RecipeSchema);

export {
  RecipeSchema,
  RecipeImageSchema,
  IngredientSchema,
  StepSchema,
  TipSchema
};
