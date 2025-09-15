import type { AllergenFlag, DietFlag } from "@/lib/recipes/types";

export const LOVE = "❤️";
export const YUM = "😋";
export const WOW = "🤩";

export const EMOJI_TO_KEY: Record<string, "love" | "yum" | "wow" | undefined> = {
  "❤️": "love",
  "♥️": "love",
  "💖": "love",
  "😋": "yum",
  "🤤": "yum",
  "🤩": "wow",
  "👏": "wow",
  "👌": "wow"
};

export const ALLERGEN_ICON: Record<AllergenFlag, string> = {
  gluten: "🌾",
  dairy: "🥛",
  egg: "🥚",
  nuts: "🌰",
  peanut: "🥜",
  soy: "🫘",
  sesame: "🟤",
  fish: "🐟",
  shellfish: "🦐"
};

export const DIET_ICON_POS: Record<DietFlag, string> = {
  vegetarian: "🥦",
  vegan: "🌱",
  "gluten-free": "🚫🌾",
  "lactose-free": "🚫🥛"
};

export const DIET_ICON_NEG: Record<DietFlag, string> = {
  vegetarian: "🍖",
  vegan: "🍗",
  "gluten-free": "🌾",
  "lactose-free": "🥛"
};
