import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import crypto from "node:crypto";
import { Comment } from "./model";
import { Recipe } from "@/modules/recipes/model";

/* ================= Shared helpers ================= */

const isObjectId = (s: any) => typeof s === "string" && /^[a-f\d]{24}$/i.test(s);

const getClientIp = (req: Request): string => {
  const xf = (req.headers["x-forwarded-for"] || "") as string;
  const ip = xf ? xf.split(",")[0].trim() : (req.ip || (req.socket as any)?.remoteAddress || "");
  return String(ip || "");
};

const ipHash = (ip: string) => {
  const salt = process.env.IP_HASH_SALT || "comment-ip-salt";
  return crypto.createHash("sha256").update(salt + "::" + ip).digest("hex");
};

const normalizeText = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

const textSig = (s: string) =>
  crypto.createHash("sha1").update(normalizeText(s)).digest("hex");

/* ================ Actor cookie (guest-only site) ================ */
export const ensureActor: RequestHandler = (req, res, next) => {
  const rxCookie = (req as any).cookies?.rx_uid;
  const valid = rxCookie && Types.ObjectId.isValid(rxCookie);
  const id = valid ? rxCookie : new Types.ObjectId().toString();

  if (!valid) {
    res.cookie("rx_uid", id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  (req as any).user = { _id: id, isGuest: true };
  next();
};

/* ================== Human verification (Enterprise) ================== */
export const recaptchaGuard: RequestHandler = async (req, res, next) => {
  try {
    // Dev/Postman bypass
    const bypass = process.env.CAPTCHA_BYPASS_TOKEN;
    if (bypass && req.headers["x-dev-skip-captcha"] === bypass) return next();

    const token =
      (req.headers["x-recaptcha-token"] as string) ||
      (req.body?.recaptchaToken as string);

    if (!token || token.length < 10) {
      return res.status(400).json({ success: false, message: "captcha token missing" });
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const apiKey  = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
    const project = process.env.GOOGLE_CLOUD_PROJECT_ID;

    // Env’de varsa sıkı kontrol; yoksa header’dan al; yoksa boş bırak.
    const expectedActionEnv = String(process.env.RECAPTCHA_EXPECTED_ACTION || "").toLowerCase();
    const expectedActionHdr = String(req.headers["x-recaptcha-action"] || "").toLowerCase();
    const expectedAction = expectedActionEnv || expectedActionHdr || "";

    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);

    if (!(apiKey && project && siteKey)) {
      return res.status(500).json({ success: false, message: "captcha not configured (enterprise)" });
    }

    // Google'a assessment: expectedAction GÖNDERMİYORUZ (daha esnek)
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${project}/assessments?key=${apiKey}`;
    const payload = {
      event: {
        token,
        siteKey,
        userIpAddress: getClientIp(req),
        userAgent: String(req.headers["user-agent"] || "")
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j: any = await r.json();

    // 1) token geçerli mi?
    if (!j?.tokenProperties?.valid) {
      res.setHeader("x-recaptcha-reason", j?.tokenProperties?.invalidReason || "invalid");
      return res.status(401).json({
        success: false,
        message: `captcha invalid (${j?.tokenProperties?.invalidReason || "unknown"})`
      });
    }

    // 2) action eşleşmesi (sadece env'de zorunlu bekleniyorsa sıkı kontrol)
    const action = String(j?.tokenProperties?.action || "").toLowerCase();
    if (expectedActionEnv && action !== expectedActionEnv) {
      res.setHeader("x-recaptcha-action", action);
      return res.status(401).json({
        success: false,
        message: `captcha action mismatch (${action} != ${expectedActionEnv})`
      });
    }

    // 3) skor
    const score = Number(j?.riskAnalysis?.score ?? 0);
    res.setHeader("x-recaptcha-score", String(score));
    if (!(score >= minScore)) {
      return res.status(401).json({ success: false, message: `captcha low score ${score}` });
    }

    return next();
  } catch (e: any) {
    return res.status(500).json({ success: false, message: "captcha error" });
  }
};
/* ================== Anti-flood (cooldown + duplicate) ================== */

const lastAtByActor = new Map<string, number>();

export const commentAntiFlood: RequestHandler = async (req, res, next) => {
  try {
    const COOLDOWN = Number(process.env.COMMENTS_COOLDOWN_SECONDS || 20);
    const MAX_LINKS = Number(process.env.COMMENTS_MAX_LINKS || 1);
    const MIN_LEN = Number(process.env.COMMENTS_MIN_LEN || 3);
    const MAX_LEN = Number(process.env.COMMENTS_MAX_LEN || 1200);

    const actor = (req as any).user;
    const rxUid: string | undefined = actor?._id;
    const ip = getClientIp(req);
    const actorKey = (rxUid ? `u:${rxUid}` : "u:unknown") + `|ip:${ip || "na"}`;
    const now = Date.now();

    // 1) Cooldown
    const last = lastAtByActor.get(actorKey) || 0;
    const diffSec = (now - last) / 1000;
    if (diffSec < COOLDOWN) {
      return res.status(429).json({ success: false, message: `cooldown_active_${Math.ceil(COOLDOWN - diffSec)}s` });
    }

    // 2) İçerik sınırları
    const text = String(req.body?.text || "");
    if (text.length < MIN_LEN) return res.status(400).json({ success: false, message: "text_too_short" });
    if (text.length > MAX_LEN) return res.status(400).json({ success: false, message: "text_too_long" });

    // 3) Link sınırı
    const linkCount = (text.match(/https?:\/\/|www\./gi) || []).length;
    if (linkCount > MAX_LINKS) return res.status(400).json({ success: false, message: "too_many_links" });

    // 4) Aynı guest id kısa sürede aynı metin?
    const { recipeId } = req.params as { recipeId: string };
    const sig = textSig(text);
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);

    const recent = await Comment.findOne({
      recipeId: new Types.ObjectId(recipeId),
      userId: rxUid ? new Types.ObjectId(rxUid) : undefined,
      createdAt: { $gte: twoMinAgo },
      isActive: true,
    })
      .select("text createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (recent && textSig(recent.text) === sig) {
      return res.status(409).json({ success: false, message: "duplicate_comment" });
    }

    lastAtByActor.set(actorKey, now);
    next();
  } catch (e) { next(e); }
};

/* ================== Handlers ================== */

export async function listRecipeComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeId } = req.params;
    if (!isObjectId(recipeId)) return res.status(400).json({ success: false, message: "Invalid recipeId" });

    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 200);

    const filter = { recipeId: new Types.ObjectId(recipeId), isActive: true, isPublished: true };
    const PUBLIC_FIELDS = "name profileImage text createdAt";
    const [items, total] = await Promise.all([
      Comment.find(filter)
        .select(PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "comments.listFetched",
      data: items,
      pagination: { page, pages: Math.ceil(total / limit), total },
    });
  } catch (e) { next(e); }
}

export async function createRecipeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeId } = req.params;
    if (!isObjectId(recipeId)) return res.status(400).json({ success: false, message: "Invalid recipeId" });

    const { text, name, email, profileImage } = (req.body || {}) as Record<string, any>;
    const actor = (req as any).user; // { _id: rx_uid, isGuest: true }
    const rxUid: string | undefined = actor?._id;

    if (!text || String(text).trim().length < 3) {
      return res.status(400).json({ success: false, message: "Text must be at least 3 characters." });
    }
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).json({ success: false, message: "Valid email is required." });
    }

    const exists = await Recipe.exists({ _id: new Types.ObjectId(recipeId) });
    if (!exists) return res.status(404).json({ success: false, message: "Recipe not found." });

    const ip = getClientIp(req);
    const doc = await Comment.create({
      recipeId: new Types.ObjectId(recipeId),
      userId: rxUid ? new Types.ObjectId(rxUid) : undefined, // guest id
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      profileImage,
      text: String(text).trim(),
      ipHash: ip ? ipHash(ip) : undefined,
      userAgent: String(req.headers["user-agent"] || ""),
      isPublished: true,
      isActive: true,
    });

    await Recipe.updateOne({ _id: new Types.ObjectId(recipeId) }, { $inc: { commentCount: 1 } });

    res.status(201).json({ success: true, message: "comments.created", data: doc.toJSON() });
  } catch (e) { next(e); }
}
