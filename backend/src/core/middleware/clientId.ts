import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const COOKIE = "cid";
const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export function clientIdMiddleware(req: Request, res: Response, next: NextFunction) {
  let cid = req.cookies?.[COOKIE] as string | undefined;
  if (!cid || cid.length < 12) {
    cid = crypto.randomUUID();
    res.cookie(COOKIE, cid, {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      maxAge: ONE_YEAR,
      path: "/"
    });
  }
  req.clientId = cid;
  next();
}
