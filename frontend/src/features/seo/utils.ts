export function siteUrlBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://ensotek.de").replace(/\/+$/, "");
}

export function absoluteUrl(input: string) {
  const base = siteUrlBase();
  if (!input) return base + "/";
  if (/^https?:\/\//i.test(input)) return input;
  return `${base}${input.startsWith("/") ? "" : "/"}${input}`;
}

/** ISO veya Date → RFC 1123 (HTTP date) */
export function httpDate(d?: string | Date | null) {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime()) ? undefined : date.toUTCString();
}

/** Gereksiz boş/undefined alanları objeden çıkarır */
export function compact<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      v === undefined ||
      v === null ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "string" && v.trim() === "")
    ) continue;
    out[k] = v;
  }
  return out;
}
