// src/app/[locale]/recipes/category/[slug]/page.tsx
import type { Metadata } from "next";
import type { SupportedLocale } from "@/types/common";
import CategoryView from "./view";
import { getTranslations } from "next-intl/server";
import { getApiBase, getLangHeaders } from "@/lib/http";

export const revalidate = 60;
export const dynamic = "force-static";

type Params = { locale: SupportedLocale; slug: string };

const pretty = (tCats: any, k: string) => {
  try { const tx = tCats(`dynamic.${k}`); if (tx) return tx; } catch {}
  const s = k.replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tCats = await getTranslations({ locale, namespace: "categories" });
  const tCatPage = await getTranslations({ locale, namespace: "categoryPage" });

  const key = decodeURIComponent(slug).toLowerCase();
  const title = pretty(tCats, key);

  let description = `${title} kategorisindeki tarifleri keşfedin.`;
  try { description = tCatPage("seoDesc", { category: title }); } catch {}

  return {
    title,
    description,
    alternates: { canonical: `/${locale}/recipes/category/${slug}` },
    openGraph: { title, description }
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "categoryPage" });

  const key = decodeURIComponent(slug).toLowerCase();

  // ✅ API: her zaman relative / proxy edilen /api kullan
  const base = getApiBase().replace(/\/+$/, ""); // örn: "/api" veya "https://backend..../api"
  const url = new URL(`${base}/recipes`, "http://dummy"); // base absolute olabilir; URL ctor host ister
  url.searchParams.set("category", encodeURIComponent(key));
  url.searchParams.set("limit", String(200));

  let res: Response;
  try {
    // base relative ise ("/api") fetch string'e dönüştürüp host’u atıyoruz:
    const href = `${base}/recipes?category=${encodeURIComponent(key)}&limit=200`;
    res = await fetch(href, {
      headers: getLangHeaders(locale),
      next: { revalidate },
    });
  } catch (e) {
    console.warn("[category] fetch error:", e);
    return (
      <div style={{ maxWidth: 860, margin: "24px auto", padding: "0 16px" }}>
        <h1>{t("error.title")}</h1>
        <p>{t("error.desc")}</p>
      </div>
    );
  }

  if (!res.ok) {
    console.warn("[category] fetch not ok:", res.status);
    return (
      <div style={{ maxWidth: 860, margin: "24px auto", padding: "0 16px" }}>
        <h1>{t("error.title")}</h1>
        <p>{t("error.desc")}</p>
      </div>
    );
  }

  const json = await res.json();
  const items = Array.isArray(json?.data) ? json.data : [];

  return (
    <div style={{ maxWidth: 1120, margin: "16px auto", padding: "0 16px" }}>
      <CategoryView locale={locale} catKey={key} items={items} />
    </div>
  );
}
