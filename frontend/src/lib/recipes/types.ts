// FE tipi -> BE'deki IRecipe ile uyumlu sadeleştirilmiş sürüm
import type { SupportedLocale } from "@/types/common";

export type Translated =
  Partial<Record<SupportedLocale, string>> & Record<string, string>;

export type ReactionKind = "like" | "love" | "yum" | "wow";
export type ReactionTotals = Partial<Record<ReactionKind, number>>;

/** Yapılandırılmış diyet & alerjen bayrakları (BE ile bire bir) */
export type DietFlag = "vegetarian" | "vegan" | "gluten-free" | "lactose-free";
export type AllergenFlag =
  | "gluten"
  | "dairy"
  | "egg"
  | "nuts"
  | "peanut"
  | "soy"
  | "sesame"
  | "fish"
  | "shellfish";

/* ---------- Media ---------- */
export interface RecipeImage {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;       // BE'de var (opsiyonel)
  alt?: Translated;
  source?: string;
}

/* ---------- Ingredients / Steps / Tips ---------- */
export interface RecipeIngredient {
  name: Translated;
  amount?: Translated;
  order?: number;
}

export interface RecipeStep {
  order: number;
  text: Translated;
}

export interface RecipeTip {
  order: number;
  text: Translated;
}

/* ---------- Nutrition per serving ---------- */
export interface Nutrition {
  calories?: number; // kcal
  protein?: number;  // g
  carbs?: number;    // g
  fat?: number;      // g
  fiber?: number;    // g
  sodium?: number;   // mg
}

/* ---------- Recipe ---------- */
export interface Recipe {
  _id?: string;
  id?: string;

  slugCanonical: string;
  slug: Translated;

  order?: number;

  title: Translated;
  description?: Translated;

  images?: RecipeImage[];

  cuisines?: string[];
  tags?: Translated[];

  /** BE: RecipeCategoryKey | null — FE sade: string | null */
  category?: string | null;

  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;

  /** BE: "easy" | "medium" | "hard" */
  difficulty?: "easy" | "medium" | "hard";

  /** Besin değerleri (1 porsiyon) */
  nutrition?: Nutrition;

  /** Geriye dönük; BE'de virtual -> nutrition.calories */
  calories?: number;

  /** Serbest metin alerjenler (örn: “yumurta”, “fındık”) */
  allergens?: string[];

  /** Yapılandırılmış diyet & alerjen bayrakları */
  dietFlags?: DietFlag[];
  allergenFlags?: AllergenFlag[];

  /** BE: ratingAvg / ratingCount / comments / reactions */
  ratingAvg?: number;
  ratingCount?: number;
  commentCount?: number;
  reactionTotals?: ReactionTotals;

  similarRecipes?: string[]; // ObjectId stringleri

  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: RecipeTip[]; // Püf noktaları (opsiyonel dizidir)

  effectiveFrom?: string;
  effectiveTo?: string;

  isPublished?: boolean;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}
