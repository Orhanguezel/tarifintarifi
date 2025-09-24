import type { MetadataRoute } from "next";

export const revalidate = 3600;

const LOCALES = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "tr,en,fr,de,it,pt,ar,ru,zh,hi")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ensotek.de").replace(/\/+$/, "");

const API_BASE = (() => {
  const be = (process.env.BACKEND_ORIGIN || "").replace(/\/+$/, "");
  if (be) return `${be}/api`;
  const pubA = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  if (pubA) return pubA;
  const pubB = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  return pubB || "";
})();

function langAlt(pathFactory: (l: string) => string) {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `${SITE}/${pathFactory(l).replace(/^\/+/, "")}`;
  map["x-default"] = `${SITE}/${(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "tr")}/`;
  return map;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Locale’li ana sayfalar
  const homeAlt = langAlt((l) => `/${l}`);
  for (const l of LOCALES) {
    entries.push({
      url: `${SITE}/${l}`,
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: homeAlt }
    });
  }

  // (İsteğe bağlı) mevcut "recipes" içeriklerini dahil et
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
            entries.push({
              url: alt[l],
              lastModified: new Date(last),
              changeFrequency: "weekly",
              priority: 0.7,
              alternates: { languages: alt }
            });
          }
        }
      }
    } catch {
      // API kapalıysa yalnızca ana sayfalar kalsın
    }
  }

  return entries;
}
