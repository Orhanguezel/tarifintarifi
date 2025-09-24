import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchNewsListServer } from "@/lib/news/api.server";
import type { INews, TranslatedField } from "@/lib/news/types";

export const revalidate = 300; // 5 dk

// İçerik dili — strict (fallback yok)
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) =>
  (tf && tf[locale]) ? tf[locale]! : "";

// Safe i18n
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.news" });
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

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getSafeT(locale);
  return basicMeta({
    locale,
    path: `/${locale}/news`,
    title: t("title", { default: "News" }),
    description: t("desc", { default: "Latest announcements and updates." }),
  });
}

export default async function NewsPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getSafeT(locale);

  let items: INews[] = [];
  try {
    items = await fetchNewsListServer({ locale, limit: 12, sort: "-publishedAt" });
  } catch {
    items = [];
  }

  return (
    <SectionScaffold
      h1={t("title", { default: "News" })}
      intro={t("intro", { default: "Follow our latest news and announcements." })}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "News" }), url: `/${locale}/news` },
      ]}
    >
      {items.length === 0 ? (
        <p style={{ color: "#666" }}>
          {t("empty", { default: "No news yet. Please check back soon." })}
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
            const title = pickStrict(it.title, locale);
            const summary = pickStrict(it.summary, locale);
            const href = `/${locale}/news/${encodeURIComponent(it.slug)}`;
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
                      alt={title || it.slug}
                      width={80}
                      height={60}
                      style={{ objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                      loading="lazy"
                    />
                  ) : null}
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: 18 }}>{title}</h3>
                    {summary ? (
                      <p style={{ margin: 0, color: "#999", fontSize: 14 }}>
                        {summary.length > 160 ? summary.slice(0, 157) + "…" : summary}
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
