import express from "express";
import rateLimit from "express-rate-limit";
import {
  publicGetRecipes,
  publicGetRecipeBySlug,
  publicSearchSuggest,
  aiGeneratePublic,
  publicSubmitRecipe
} from "./public.controller";
import {
  validatePublicQuery,
  validateSlug,
  validateSearchQuery,
  validateSubmitRecipe,
} from "./validation";

const router = express.Router();

/* ========= RATE LIMITS (env kontrollü) ========= */
const WINDOW_MS   = Number(process.env.RECIPES_PUBLIC_WINDOW_MS   || 60_000);
const LIST_MAX    = Number(process.env.RECIPES_PUBLIC_LIST_MAX    || 120);
const DETAIL_MAX  = Number(process.env.RECIPES_PUBLIC_DETAIL_MAX  || 200);
const GENERATE_MAX= Number(process.env.RECIPES_PUBLIC_GENERATE_MAX|| 10);
const SEARCH_MAX  = Number(process.env.RECIPES_PUBLIC_SEARCH_MAX  || 200);

const listLimiter     = rateLimit({ windowMs: WINDOW_MS, max: LIST_MAX,     standardHeaders: true, legacyHeaders: false });
const detailLimiter   = rateLimit({ windowMs: WINDOW_MS, max: DETAIL_MAX,   standardHeaders: true, legacyHeaders: false });
const generateLimiter = rateLimit({ windowMs: WINDOW_MS, max: GENERATE_MAX, standardHeaders: true, legacyHeaders: false });
const searchLimiter   = rateLimit({ windowMs: WINDOW_MS, max: SEARCH_MAX,   standardHeaders: true, legacyHeaders: false });

// --- Public Endpoints ---
router.get("/",        listLimiter,   validatePublicQuery,  publicGetRecipes);
router.get("/search",  searchLimiter, validateSearchQuery,  publicSearchSuggest);
router.get("/:slug",   detailLimiter, validateSlug,         publicGetRecipeBySlug);

// AI üretim + DB'ye kaydet (public; rate-limit zorunlu)
router.post("/generate", generateLimiter, aiGeneratePublic);

// Manuel tarif gönderme
router.post("/submit", validateSubmitRecipe, publicSubmitRecipe);

export default router;
