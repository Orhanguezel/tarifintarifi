// /modules/recipes/types.ts
import type { Types } from "mongoose";
import type { SupportedLocale } from "@/types/common";
import type { RecipeCategoryKey } from "../categories";

export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;
export type Difficulty = "easy" | "medium" | "hard";

/* ---------- Media ---------- */
export interface IRecipeImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  alt?: TranslatedLabel;
  source?: string;
}

/* ---------- Ingredients / Steps / Tips ---------- */
export interface IRecipeIngredient {
  name: TranslatedLabel;
  amount?: TranslatedLabel;
  order?: number; // 0..N
}

export interface IRecipeStep {
  order: number;  // 1..N
  text: TranslatedLabel;
}

export interface IRecipeTip {
  order: number;  // 1..N
  text: TranslatedLabel;
}

/* ---------- Categorization ---------- */
// Kategoriler serbest string -> ObjectId ihtiyacı kalmadı; gerek yoksa silin
// export type RecipeCategoryId = Types.ObjectId;

export type ReactionKind = "like" | "love" | "yum" | "wow";
export type ReactionTotals = Partial<Record<ReactionKind, number>>;

export type DietFlag = "vegetarian" | "vegan" | "gluten-free" | "lactose-free";
export type AllergenFlag =
  | "gluten" | "dairy" | "egg" | "nuts" | "peanut" | "soy" | "sesame" | "fish" | "shellfish";

/* ---------- Nutrition per serving ---------- */
export interface INutrition {
  calories?: number; // kcal
  protein?: number;  // g
  carbs?: number;    // g
  fat?: number;      // g
  fiber?: number;    // g
  sodium?: number;   // mg
}

/* ---------- Recipe ---------- */
export interface IRecipe {
  _id?: Types.ObjectId;

  slugCanonical: string; // unique
  slug: TranslatedLabel;

  order?: number;

  title: TranslatedLabel;
  description?: TranslatedLabel;

  images: IRecipeImage[];

  cuisines?: string[];
  tags?: TranslatedLabel[];

  category?: RecipeCategoryKey | null;

  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  difficulty?: Difficulty;

  nutrition?: INutrition;
  calories?: number;

  allergens?: string[];
  dietFlags?: DietFlag[];
  allergenFlags?: AllergenFlag[];

  ratingAvg?: number;
  ratingCount?: number;
  commentCount?: number;
  reactionTotals?: ReactionTotals;

  similarRecipes?: Types.ObjectId[];

  ingredients: IRecipeIngredient[];
  steps: IRecipeStep[];
  tips?: IRecipeTip[];

  effectiveFrom?: Date;
  effectiveTo?: Date;

  isPublished: boolean;
  isActive: boolean;

  // create sırasında yok → opsiyonel
  createdAt?: Date;
  updatedAt?: Date;
}
