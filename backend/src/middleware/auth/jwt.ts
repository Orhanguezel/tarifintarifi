// src/middleware/auth/jwt.ts
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";

const ACCESS_TTL: SignOptions["expiresIn"] =
  (process.env.JWT_ACCESS_TTL as SignOptions["expiresIn"]) || "7d";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
const JWT_SECRET = process.env.JWT_SECRET as Secret;

export type JwtPayload = {
  sub: string;
  email: string;
  role: "admin" | "editor" | "viewer";
};

export function signAccess(p: JwtPayload): string {
  const opts: SignOptions = { expiresIn: ACCESS_TTL };
  return jwt.sign(p, JWT_SECRET, opts);
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
