// src/modules/users/controller.ts
import type { Request, Response } from "express";
import { loginSchema, createAdminSchema, changePasswordSchema } from "./validation";
import { findActiveByEmail, verifyPassword, hashPassword } from "./service";
import { clearAuthCookies, setAuthCookies } from "@/middleware/auth/issueTokens";
import { verifyAccess } from "@/middleware/auth/jwt";
import { getTokenFromRequest } from "@/middleware/auth/authHelpers";
import { UserModel } from "./model";

/** POST /users/register */
export async function registerAdmin(req: Request, res: Response) {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: "INVALID_INPUT" });

  const { email, password, role } = parsed.data;
  const exists = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (exists) return res.status(409).json({ error: "EMAIL_IN_USE" });

  const passwordHash = await hashPassword(password);
  const created = await UserModel.create({ email: email.toLowerCase(), passwordHash, role, active: true });

  const payload = { sub: String(created._id), email: created.email, role: created.role };
  const { at, csrf } = setAuthCookies(res, payload);
  return res.status(201).json({ id: created._id, email: created.email, role: created.role, at, csrf });
}

/** POST /users/login */
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: "INVALID_INPUT" });

  const { email, password } = parsed.data;
  const user = await findActiveByEmail(email);
  if (!user || !(await verifyPassword(user.passwordHash, password)))
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const payload = { sub: String(user._id), email: user.email, role: user.role };
  const { at, csrf } = setAuthCookies(res, payload);
  await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return res.json({ email: user.email, role: user.role, at, csrf });
}

/** POST /users/change-password (auth gerekli) — (senin eklediğin gibi) */
export async function changePassword(req: Request, res: Response) { /* değişmedi */ }

/** GET /users/me */
export async function me(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });
  res.json(req.user);
}

/** POST /users/refresh  (REFRESH TOKEN YOK — geçerli access token’ı “yeniden imzala”) */
export async function refresh(req: Request, res: Response) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED", reason: "NO_TOKEN" });

  try {
    const p = verifyAccess(token); // geçerliyse payload ok
    const payload = { sub: p.sub, email: p.email, role: p.role };
    setAuthCookies(res, payload);  // yeni expirye sahip accessToken + yeni CSRF
    res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

/** POST /users/logout */
export async function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  res.status(204).end();
}

