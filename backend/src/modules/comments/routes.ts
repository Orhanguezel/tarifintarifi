import express from "express";
import rateLimit from "express-rate-limit";
import {
  ensureActor,
  recaptchaGuard,
  commentAntiFlood,
  listRecipeComments,
  createRecipeComment,
} from "./controller";

const router = express.Router();

/* ========= RATE LIMITS =========
 * Env:
 *  - COMMENTS_WINDOW_MS (default 60000)
 *  - COMMENTS_MAX_PER_WINDOW (default 5)
 */
const WINDOW_MS = Number(process.env.COMMENTS_WINDOW_MS || 60_000);
const MAX_PER_WINDOW = Number(process.env.COMMENTS_MAX_PER_WINDOW || 5);

// IP yerine aktör (rx_uid) anahtar
const keyGenerator = (req: any) => (req?.user?._id ? `u:${req.user._id}` : (req.ip || "ip:unknown"));

const createLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_PER_WINDOW,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "rate_limited" },
});

// Public list
router.get("/recipe/:recipeId", listRecipeComments);

// Public create (guest) + rate-limit + CAPTCHA + anti-flood
router.post(
  "/recipe/:recipeId",
  ensureActor,
  createLimiter,
  recaptchaGuard,
  commentAntiFlood,
  createRecipeComment
);

export default router;
