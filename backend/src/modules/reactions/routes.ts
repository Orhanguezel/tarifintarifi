import express from "express";
import { ensureActor, toggleReaction, setReaction, rate, getSummary, getMyReactions } from "./controller";

const router = express.Router();

/** Public (guest-friendly) endpoints */
// toggle/set → actor garanti
router.post("/toggle", ensureActor, toggleReaction);
router.post("/set", ensureActor, setReaction);

// rating → actor garanti (misafir de puan verebilir, cookie ile izler)
router.post("/rate", ensureActor, rate);

// summaries
router.get("/summary", getSummary);

// user's own reactions
router.get("/me", ensureActor, getMyReactions);

export default router;
