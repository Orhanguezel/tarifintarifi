import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchReferencesListServer } from "@/lib/references/api.server";
import type { IReferences, TranslatedField } from "@/lib/references/types";

export const revalidate = 300;

// İçerik dilini strict oku (fallback yok)
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) =>
  (tf && tf[locale]) ? tf[locale]! : "";

// UI çevirileri: safe t (key yoksa default)
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.references" });
    return (key, values) => {
      try {
        const out = (t as any)(key, values);
        return typeof out === "string" && out.trim() ? out : (values?.default ?? key);
      } catch {
        return values?.default ?? key;
      }
    };
  } catch {
    return (key, values) => values?.default ?? key;
  }
}

// Next 15
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getSafeT(locale);

  return basicMeta({
    locale,
    path: `/${locale}/references`,
    title: t("title", { default: "References" }),
    description: t("desc", { default: "Our customers and projects." }),
  });
}

export default async function ReferencesPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getSafeT(locale);

  let items: IReferences[] = [];
  try {
    items = await fetchReferencesListServer({ locale, limit: 48, sort: "-publishedAt" });
  } catch {
    items = [];
  }

  return (
    <SectionScaffold
      h1={t("title", { default: "References" })}
      intro={t("intro", { default: "A selection of clients and case logos." })}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "References" }), url: `/${locale}/references` },
      ]}
    >
      {items.length === 0 ? (
        <p style={{ color: "#666" }}>
          {t("empty", { default: "No references yet. Please check back soon." })}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            alignItems: "center",
          } as React.CSSProperties}
        >
          {items.map((it) => {
            const title = pickStrict(it.title, locale) || it.slug;
            const logo =
              it.images?.[0]?.webp || it.images?.[0]?.thumbnail || it.images?.[0]?.url;

            const href = `/${locale}/references/${encodeURIComponent(it.slug)}`;

            return (
              <a
                key={it._id}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--card-bg, #111)",
                  border: "1px solid var(--card-bright, rgba(255,255,255,.12))",
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 120,
                  textDecoration: "none",
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={title}
                    width={160}
                    height={80}
                    style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
                    loading="lazy"
                  />
                ) : (
                  <span style={{ color: "#aaa" }}>{title}</span>
                )}
              </a>
            );
          })}
        </div>
      )}
    </SectionScaffold>
  );
}
