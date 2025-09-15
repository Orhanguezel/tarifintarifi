// FE tipi -> BE'deki IRecipe ile uyumlu sadeleştirilmiş sürüm

export type Translated = Record<string, string>; // (10 dil gelir ama map key'i string)

export type ReactionKind = "like" | "love" | "yum" | "wow";
export type ReactionTotals = Partial<Record<ReactionKind, number>>;

export interface RecipeImage {
  url: string;
  thumbnail: string;
  webp?: string;
  alt?: Translated;
  source?: string;
}

export interface RecipeIngredient {
  name: Translated;
  amount?: Translated;
  order?: number;
}

export interface RecipeStep {
  order: number;
  text: Translated;
}

export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

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

  category?: string | null;

  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  /** BE: "easy" | "medium" | "hard" */
  difficulty?: "easy" | "medium" | "hard";

  /** BE: nutrition.calories içinden geliyor */
  nutrition?: Nutrition;

  allergens?: string[];
  dietFlags?: Array<"vegetarian" | "vegan" | "gluten-free" | "lactose-free">;

  /** BE: ratingAvg / ratingCount */
  ratingAvg?: number;
  ratingCount?: number;

  commentCount?: number;

  /** BE: reactionTotals.like gibi */
  reactionTotals?: ReactionTotals;

  similarRecipes?: string[]; // ObjectId stringleri

  ingredients: RecipeIngredient[];
  steps: RecipeStep[];

  effectiveFrom?: string;
  effectiveTo?: string;

  isPublished?: boolean;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}
