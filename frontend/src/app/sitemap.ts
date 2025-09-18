// app/sitemap.ts
import type { MetadataRoute } from "next";

// ❌ export const revalidate = 60 * 60;
export const revalidate = 3600; // ✅ literal sayı olmalı

const LOCALES = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "tr,en,fr,de,it,pt,ar,ru,zh,hi")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/,"");

// API tabanı (önce backend origin, yoksa public url)
const API_BASE = (() => {
  const be = (process.env.BACKEND_ORIGIN || "").replace(/\/+$/,"");
  if (be) return `${be}/api`;
  const pub = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/,"");
  return pub || "";
})();

function langAlt(pathFactory: (l: string) => string) {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `${SITE}/${pathFactory(l).replace(/^\/+/,"")}`;
  return map;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Kök yerelleştirilmiş sayfalar + hreflang
  const homeAlt = langAlt((l) => `/${l}`);
  for (const l of LOCALES) {
    entries.push({
      url: `${SITE}/${l}`,
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: homeAlt }
    });
  }

  if (API_BASE) {
    try {
      const r = await fetch(
        `${API_BASE}/recipes?limit=200&fields=slug,slugCanonical,updatedAt,createdAt`,
        { next: { revalidate } }
      );
      if (r.ok) {
        const { data = [] } = (await r.json()) as {
          data: Array<{ slug?: any; slugCanonical?: string; updatedAt?: string; createdAt?: string }>;
        };

        for (const rec of data) {
          const last = rec.updatedAt || rec.createdAt || new Date().toISOString();
          const alt = langAlt((l) => {
            if (rec.slug && typeof rec.slug === "object") {
              return `/${l}/recipes/${encodeURIComponent(rec.slug[l] || rec.slug.tr || rec.slugCanonical || "")}`;
            }
            const baseSlug = typeof rec.slug === "string" ? rec.slug : (rec.slugCanonical || "");
            return `/${l}/recipes/${encodeURIComponent(baseSlug)}`;
          });

          for (const l of LOCALES) {
            const url = alt[l];
            entries.push({
              url,
              lastModified: new Date(last),
              changeFrequency: "weekly",
              priority: 0.7,
              alternates: { languages: alt }
            });
          }
        }
      }
    } catch {
      // API erişilemezse sadece ana sayfalar kalsın
    }
  }

  return entries;
}
