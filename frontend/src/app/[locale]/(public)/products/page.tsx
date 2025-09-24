// app/[locale]/(public)/products/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchProductsListServer } from "@/lib/products/api.server";
import type { IEnsotekprod, TranslatedLabel } from "@/lib/products/types";

export const revalidate = 300; // 5 dk

// ── İçerik için SIKI dil okuma (fallback yok) ─────────────────────────────────
function pickStrict(tf: TranslatedLabel | undefined, locale: SupportedLocale): string {
  return (tf && tf[locale]) ? tf[locale]! : "";
}

// ── UI çevirileri için GÜVENLİ t (key yoksa default döndür, throw etme) ─────
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.products" });
    return (key, values) => {
      try {
        const out = (t as any)(key, values);
        return typeof out === "string" && out.trim()
          ? out
          : (values?.default ?? key);
      } catch {
        return values?.default ?? key;
      }
    };
  } catch {
    return (key, values) => values?.default ?? key;
  }
}

// Next 15: params Promise
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const t = await getSafeT(locale);

  return basicMeta({
    locale,
    path: `/${locale}/products`,
    title: t("title", { default: "Products" }),
    description: t("desc", { default: "Explore our industrial products." }),
  });
}

export default async function ProductsPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const t = await getSafeT(locale);

  // Verileri çek (liste)
  let items: IEnsotekprod[] = [];
  try {
    items = await fetchProductsListServer({ locale, limit: 12, sort: "-createdAt" });
  } catch {
    items = [];
  }

  return (
    <SectionScaffold
      h1={t("title", { default: "Products" })}
      intro={t("intro", { default: "Industrial equipment and components." })}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "Products" }), url: `/${locale}/products` },
      ]}
    >
      {items.length === 0 ? (
        <p style={{ color: "#666" }}>
          {t("empty", { default: "No products yet. Please check back soon." })}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          } as React.CSSProperties}
        >
          {items.map((it) => {
            const name = pickStrict(it.name, locale);
            const desc = pickStrict(it.description, locale);
            const href = `/${locale}/products/${encodeURIComponent(it.slug)}`;
            const thumb =
              it.images?.[0]?.webp || it.images?.[0]?.thumbnail || it.images?.[0]?.url;

            return (
              <a
                key={it._id}
                href={href}
                style={{
                  display: "block",
                  background: "var(--card-bg, #111)",
                  border: "1px solid var(--card-bright, rgba(255,255,255,.12))",
                  borderRadius: 12,
                  padding: 14,
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={name || it.slug}
                      width={80}
                      height={60}
                      style={{ objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                      loading="lazy"
                    />
                  ) : null}
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: 18 }}>{name}</h3>
                    {desc ? (
                      <p style={{ margin: 0, color: "#999", fontSize: 14 }}>
                        {desc.length > 160 ? desc.slice(0, 157) + "…" : desc}
                      </p>
                    ) : null}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </SectionScaffold>
  );
}
