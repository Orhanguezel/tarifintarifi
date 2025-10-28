import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import { Reaction } from "./model";
import { Recipe } from "@/modules/recipes/model";

/** Misafir + login kullanıcıyı garanti altına alır (rx_uid cookie) */
export const ensureActor: RequestHandler = (req, res, next) => {
  const u = (req as any).user;
  if (u?._id && Types.ObjectId.isValid(u._id)) return next();

  const rxCookie = (req as any).cookies?.rx_uid;
  let id = (rxCookie && Types.ObjectId.isValid(rxCookie)) ? rxCookie : new Types.ObjectId().toString();
  res.cookie("rx_uid", id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  (req as any).user = { _id: id, isGuest: true };
  next();
};

/** ReactionTotals (recipe.model) için basit eşleme:
 * - LIKE → like
 * - EMOJI → (❤️ -> love, 😋/🤤 -> yum, 🤩/👏/👌 -> wow)
 * Diğer emojiler sayılır ama totals'a yansıtılmayabilir (isteğe göre genişlet).
 */
const EMOJI_TO_KEY: Record<string, "love" | "yum" | "wow"> = {
  "❤️": "love", "♥️": "love", "💖": "love",
  "😋": "yum", "🤤": "yum",
  "🤩": "wow", "👏": "wow", "👌": "wow",
};

/** Tek bir tarif için toplamları ve puanı güncelle */
async function updateRecipeAggregates(recipeId: Types.ObjectId | string) {
  const rid = new Types.ObjectId(recipeId);

  const [agg] = await Reaction.aggregate([
    { $match: { recipeId: rid, isActive: true } },
    {
      $facet: {
        byKind: [{ $group: { _id: "$kind", c: { $sum: 1 } } }],
        byEmoji: [{ $match: { kind: "EMOJI" } }, { $group: { _id: "$emoji", c: { $sum: 1 } } }],
        rating: [{ $match: { kind: "RATING" } }, { $group: { _id: null, avg: { $avg: "$value" }, cnt: { $sum: 1 } } }],
      }
    }
  ]);

  const byKind = Object.fromEntries((agg?.byKind || []).map((r: any) => [r._id, r.c]));
  const byEmoji: Record<string, number> = Object.fromEntries((agg?.byEmoji || []).map((r: any) => [r._id, r.c]));
  const ratingAvg = agg?.rating?.[0]?.avg ?? 0;
  const ratingCount = agg?.rating?.[0]?.cnt ?? 0;

  // reactionTotals hesapla
  const totals: any = { like: Number(byKind?.LIKE || 0), love: 0, yum: 0, wow: 0 };
  for (const [emoji, count] of Object.entries(byEmoji)) {
    const key = EMOJI_TO_KEY[emoji];
    if (key) totals[key] = (totals[key] || 0) + Number(count || 0);
  }

  await Recipe.updateOne(
    { _id: rid },
    {
      $set: {
        reactionTotals: totals,
        ratingAvg: ratingCount ? Math.round(Number(ratingAvg) * 100) / 100 : 0,
        ratingCount
      }
    }
  );
}

/* ---------- Validators (hafif) ---------- */
const isObjectId = (s: any) => typeof s === "string" && /^[a-f\d]{24}$/i.test(s);

/* ---------- Handlers ---------- */

/** POST /api/reactions/toggle
 * body: { recipeId, kind: "LIKE"|"FAVORITE"|"BOOKMARK"|"EMOJI", emoji? }
 */
export async function toggleReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: string | undefined = (req as any).user?._id;
    if (!userId || !isObjectId(userId)) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { recipeId, kind } = req.body as { recipeId: string; kind: "LIKE" | "FAVORITE" | "BOOKMARK" | "EMOJI"; emoji?: string };
    if (!isObjectId(recipeId)) return res.status(400).json({ success: false, message: "Invalid recipeId" });
    if (!["LIKE","FAVORITE","BOOKMARK","EMOJI"].includes(kind)) return res.status(400).json({ success: false, message: "Invalid kind" });

    const emoji = kind === "EMOJI" ? String(req.body.emoji || "").trim() : null;
    if (kind === "EMOJI" && !emoji) return res.status(400).json({ success: false, message: "Emoji required" });

    const query = { user: new Types.ObjectId(userId), recipeId: new Types.ObjectId(recipeId), kind, emoji };
    const existing = await Reaction.findOne(query);

    if (existing) {
      await existing.deleteOne();
      await updateRecipeAggregates(recipeId);
      return res.json({ success: true, message: "toggled_off", data: { on: false } });
    }

    await Reaction.create({ ...query, extra: req.body?.extra || {} });
    await updateRecipeAggregates(recipeId);
    res.status(201).json({ success: true, message: "toggled_on", data: { on: true } });
  } catch (e) { next(e); }
}

/** POST /api/reactions/set  (idempotent on/off) */
export async function setReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: string | undefined = (req as any).user?._id;
    if (!userId || !isObjectId(userId)) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { recipeId, kind, on } = req.body as { recipeId: string; kind: "LIKE" | "FAVORITE" | "BOOKMARK" | "EMOJI"; emoji?: string; on: boolean };
    if (!isObjectId(recipeId)) return res.status(400).json({ success: false, message: "Invalid recipeId" });
    if (!["LIKE","FAVORITE","BOOKMARK","EMOJI"].includes(kind)) return res.status(400).json({ success: false, message: "Invalid kind" });

    const emoji = kind === "EMOJI" ? String(req.body.emoji || "").trim() : null;
    if (kind === "EMOJI" && !emoji) return res.status(400).json({ success: false, message: "Emoji required" });

    const query = { user: new Types.ObjectId(userId), recipeId: new Types.ObjectId(recipeId), kind, emoji };
    const exists = await Reaction.findOne(query);

    if (on && !exists) {
      await Reaction.create({ ...query, extra: req.body?.extra || {} });
    } else if (!on && exists) {
      await exists.deleteOne();
    }
    await updateRecipeAggregates(recipeId);
    res.status(on && !exists ? 201 : 200).json({ success: true, message: "updated", data: { on } });
  } catch (e) { next(e); }
}

/** POST /api/reactions/rate
 * body: { recipeId, value(1..5) }
 */
export async function rate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: string | undefined = (req as any).user?._id;
    if (!userId || !isObjectId(userId)) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { recipeId, value } = req.body as { recipeId: string; value: number };
    if (!isObjectId(recipeId)) return res.status(400).json({ success: false, message: "Invalid recipeId" });

    const v = Math.max(1, Math.min(5, Number(value)));
    const filter = { user: new Types.ObjectId(userId), recipeId: new Types.ObjectId(recipeId), kind: "RATING" as const, emoji: null };

    await Reaction.findOneAndUpdate(filter, { $set: { value: v, isActive: true, extra: req.body?.extra || {} } }, { upsert: true, new: true });
    await updateRecipeAggregates(recipeId);

    res.status(201).json({ success: true, message: "rating_updated", data: { value: v } });
  } catch (e) { next(e); }
}

/** GET /api/reactions/summary?recipeId=... | recipeIds=a,b,c&breakdown=none|kind|emoji|kind+emoji  */
export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const ids: string[] =
      (req.query.recipeIds ? String(req.query.recipeIds).split(",") : [])
        .concat(req.query.recipeId ? [String(req.query.recipeId)] : [])
        .map(s => s.trim())
        .filter(isObjectId);

    if (!ids.length) return res.status(400).json({ success: false, message: "recipeId or recipeIds required" });

    const rawBr = String(req.query.breakdown ?? "kind").replace(/\s+/g, "+").replace(/,/g, "+").toLowerCase();
    const breakdown: "none" | "kind" | "emoji" | "kind+emoji" =
      (["none","kind","emoji","kind+emoji"].includes(rawBr) ? rawBr : "kind") as any;

    const groupId: any =
      breakdown === "none" ? { recipeId: "$recipeId" } :
      breakdown === "emoji" ? { recipeId: "$recipeId", emoji: "$emoji" } :
      breakdown === "kind+emoji" ? { recipeId: "$recipeId", kind: "$kind", emoji: "$emoji" } :
      { recipeId: "$recipeId", kind: "$kind" };

    const rows = await Reaction.aggregate([
      { $match: { recipeId: { $in: ids.map((s) => new Types.ObjectId(s)) }, isActive: true } },
      { $group: { _id: groupId, count: { $sum: 1 } } }
    ]);

    const result: Record<string, any> = {};
    for (const r of rows) {
      const rid = String((r as any)._id.recipeId);
      result[rid] ||= { total: 0, byKind: {}, byEmoji: {} };
      result[rid].total += r.count;
      if (breakdown.includes("kind") && (r._id as any).kind) {
        const k = (r._id as any).kind;
        result[rid].byKind[k] = (result[rid].byKind[k] || 0) + r.count;
      }
      if (breakdown.includes("emoji") && (r._id as any).emoji) {
        const e = (r._id as any).emoji;
        result[rid].byEmoji[e] = (result[rid].byEmoji[e] || 0) + r.count;
      }
    }

    res.json({ success: true, message: "listed", data: result });
  } catch (e) { next(e); }
}

/** GET /api/reactions/me?recipeIds=a,b,c  — (misafir destekli) */
export async function getMyReactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: string | undefined = (req as any).user?._id;
    if (!userId || !isObjectId(userId)) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ids = String(req.query.recipeIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(isObjectId);

    const filter: any = { user: new Types.ObjectId(userId) };
    if (ids.length) filter.recipeId = { $in: ids.map((id) => new Types.ObjectId(id)) };

    const items = await Reaction.find(filter).lean();
    res.json({
      success: true,
      message: "fetched",
      data: items.map((x) => ({
        recipeId: x.recipeId,
        kind: x.kind,
        emoji: x.emoji ?? undefined,
        value: x.value ?? undefined,
      })),
    });
  } catch (e) { next(e); }
}
