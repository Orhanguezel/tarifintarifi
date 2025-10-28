// src/lib/strings.ts
export function toSlugSafe(v?: string) {
  const lower = String(v ?? "").toLowerCase();
  const n = typeof (lower as any).normalize === "function" ? lower.normalize("NFKD") : lower;
  return n
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function prettyFromSlug(k: string) {
  const s = String(k || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
}

export function decodeQueryValue(v?: string) {
  if (!v) return "";
  const s = String(v).replace(/\+/g, " "); // '+' => space
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // zaten decode edilemiyorsa raw halini kullan
  }
}
