// src/utils/authHelpers.ts
import { Request } from "express";
const ACCESS_COOKIE = process.env.COOKIE_NAME || "accessToken";

export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const fromCookie = req.cookies?.[ACCESS_COOKIE] || null;
  return bearer || fromCookie;
};
