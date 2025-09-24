// src/app/[locale]/(public)/about/[slug]/page.tsx
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchAboutBySlugServer } from "@/lib/about/api.server";
import type { TranslatedField, IAbout } from "@/lib/about/types";

export const revalidate = 300; // 5 dk

// ── Yardımcılar ───────────────────────────────────────────────────────────────
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) =>
  tf?.[locale] ?? "";

const clip = (s: string, n = 160) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// "pages.about" namespace'inde güvenli t: key yoksa default döndür, throw etme
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.about" });
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

// Next 15
type ParamsP = Promise<{ locale: string; slug?: string }>;
type SearchP = Promise<Record<string, string | string[] | undefined>>;

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
): Promise<Metadata> {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  const t = await getSafeT(locale);

  if (!slug) {
    return basicMeta({
      locale,
      path: `/${locale}/about`,
      title: t("title", { default: "About" }),
      description: t("desc", { default: "About our company." }),
    });
  }

  const item = await fetchAboutBySlugServer(slug, locale);
  if (!item) {
    return basicMeta({
      locale,
      path: `/${locale}/about/${encodeURIComponent(slug)}`,
      title: t("title", { default: "About" }),
      description: t("desc", { default: "About our company." }),
    });
  }

  const title = pickStrict(item.title, locale);
  const summary = pickStrict(item.summary, locale);
  const displayTitle = title || item.slug; // slug fallback (dil fallback değil)

  return basicMeta({
    locale,
    path: `/${locale}/about/${encodeURIComponent(slug)}`,
    title: displayTitle,
    description: clip(summary) || t("desc", { default: "About our company." }),
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function AboutDetailPage(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
) {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  if (!slug) redirect(`/${locale}/about`);
  if (!slugFromParams && slug) redirect(`/${locale}/about/${encodeURIComponent(slug)}`);

  const t = await getSafeT(locale);

  const item: IAbout | null = await fetchAboutBySlugServer(slug!, locale);
  if (!item) notFound();

  const title = pickStrict(item.title, locale);
  const summary = pickStrict(item.summary, locale);
  const content = pickStrict(item.content, locale);
  const displayTitle = title || item.slug;

  const hero =
    item.images?.[0]?.webp || item.images?.[0]?.thumbnail || item.images?.[0]?.url || "";

  return (
    <SectionScaffold
      h1={displayTitle}
      intro={summary || undefined}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "About" }), url: `/${locale}/about` },
        { name: displayTitle, url: `/${locale}/about/${encodeURIComponent(slug!)}` },
      ]}
    >
      {hero ? (
        <div style={{ margin: "8px 0 14px" }}>
          <img
            src={hero}
            alt={displayTitle}
            width={900}
            height={540}
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid var(--card-bright, rgba(255,255,255,.12))",
            }}
            loading="eager"
          />
        </div>
      ) : null}

      {content ? (
        <article
          style={{ lineHeight: 1.7, color: "var(--text, #ddd)" }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : null}
    </SectionScaffold>
  );
}
