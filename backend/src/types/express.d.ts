import "express";
import type { SupportedLocale } from "./common";

declare module "express-serve-static-core" {
  interface Request {
    locale?: SupportedLocale;
    t?: (key: string, defaultText?: string) => string;
    clientId?: string;
  }
}
