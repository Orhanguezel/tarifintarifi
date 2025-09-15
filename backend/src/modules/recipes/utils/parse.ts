// /home/orhan/Dokumente/tariftarif/backend/src/modules/recipes/utils/parse.ts
import { Types } from "mongoose";

/** String JSON ise parse eder; değilse olduğu gibi döner */
export const parseIfJson = (v: any) => {
  try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return v; }
};

/** "['a','b']" | "a,b" | ["a","b"] -> ["a","b"] */
export const toStringArray = (raw: any): string[] => {
  const v = parseIfJson(raw);
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  if (v == null || v === "") return [];
  return String(v).split(",").map((x) => x.trim()).filter(Boolean);
};

export const truthy = (v: any) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "on" || v === "yes";

/** JSON dönüşümünde ObjectId -> string */
export const stringifyIdsDeep = (obj: any): any => {
  if (obj == null) return obj;
  if (obj instanceof Types.ObjectId) return obj.toString();
  if (Array.isArray(obj)) return obj.map(stringifyIdsDeep);
  if (typeof obj === "object") { for (const k of Object.keys(obj)) obj[k] = stringifyIdsDeep(obj[k]); return obj; }
  return obj;
};

export const lines = (txt?: string) =>
  String(txt || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

