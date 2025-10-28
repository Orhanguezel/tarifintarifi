// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { apiRateLimiter } from "@/middleware/rateLimit";
import { localeMiddleware } from "@/middleware/locale";
import { clientIdMiddleware } from "@/middleware/clientId";
import { notFound, errorHandler } from "@/middleware/error";

// 📦 (local storage için) /uploads statik servis
import { serveUploads } from "@/middleware/uploadMiddleware";

/* feature routes */
import recipeRoutes from "@/modules/recipes/routes";
import reactionRoutes from "@/modules/reactions/routes";
import commentRoutes from "@/modules/comments/routes";

// 🆕 yeni routerlar
import adminRecipeRoutes from "@/modules/admin/routes";
import userRoutes from "@/modules/users/routes";

const app = express();

/** We are behind Nginx; trust proxy so req.ip, rate limit, etc. work properly */
app.set("trust proxy", 1);

/** Security & perf */
app.use(helmet());
app.use(compression());

/** CORS (allow only configured origins; credentials enabled) */
const corsOrigin = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigin.length ? corsOrigin : true,
    credentials: true,
  })
);

/** Parsers & logs */
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

/** Locale & client id */
app.use(localeMiddleware);
app.use(clientIdMiddleware);

/** (local storage ise) statik uploads — Cloudinary modunda da açık kalabilir zararı yok */
app.use("/uploads", serveUploads);

/** Global API rate limiter */
app.use("/api", apiRateLimiter);

/** Health endpoints (both /api and root for convenience) */
const sendHealth = (res: express.Response, extra: Record<string, unknown> = {}) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV,
    ts: Date.now(),
    ...extra,
  });
};

app.get("/api/healthz", (req, res) => sendHealth(res, { ip: req.ip }));
app.head("/api/healthz", (_req, res) => res.sendStatus(200));
app.get("/healthz", (_req, res) => sendHealth(res));
app.head("/healthz", (_req, res) => res.sendStatus(200));
app.get("/health", (_req, res) => sendHealth(res));

/** API routes */
// public modules
app.use("/api/recipes", recipeRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/comments", commentRoutes);

// 🆕 users/auth
app.use("/api/users", userRoutes);

// 🆕 admin panel (recipes CRUD + media)
app.use("/api/admin/recipes", adminRecipeRoutes);

/** 404 & error handlers */
app.use(notFound);
app.use(errorHandler);

export default app;
