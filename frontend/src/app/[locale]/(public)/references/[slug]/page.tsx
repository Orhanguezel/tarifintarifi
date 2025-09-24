import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchReferencesBySlugServer } from "@/lib/references/api.server";
import type { IReferences, TranslatedField } from "@/lib/references/types";

export const revalidate = 300;

// helpers
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) => tf?.[locale] ?? "";
const clip = (s: string, n = 160) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// safe i18n
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
type ParamsP = Promise<{ locale: string; slug?: string }>;
type SearchP = Promise<Record<string, string | string[] | undefined>>;

// metadata
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
      path: `/${locale}/references`,
      title: t("title", { default: "References" }),
      description: t("desc", { default: "Our customers and projects." }),
    });
  }

  const item = await fetchReferencesBySlugServer(slug, locale);
  if (!item) {
    return basicMeta({
      locale,
      path: `/${locale}/references/${encodeURIComponent(slug)}`,
      title: t("title", { default: "References" }),
      description: t("desc", { default: "Our customers and projects." }),
    });
  }

  const title = pickStrict(item.title, locale) || item.slug;
  const summary = pickStrict(item.content, locale); // içerik kısa kullanılabilir

  return basicMeta({
    locale,
    path: `/${locale}/references/${encodeURIComponent(slug)}`,
    title,
    description: clip(summary) || t("desc", { default: "Our customers and projects." }),
  });
}

// page
export default async function ReferencesDetailPage(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
) {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  if (!slug) redirect(`/${locale}/references`);
  if (!slugFromParams && slug) redirect(`/${locale}/references/${encodeURIComponent(slug)}`);

  const t = await getSafeT(locale);

  const item: IReferences | null = await fetchReferencesBySlugServer(slug!, locale);
  if (!item) notFound();

  const title = pickStrict(item.title, locale) || item.slug;
  const content = pickStrict(item.content, locale);
  const hero =
    item.images?.[0]?.webp || item.images?.[0]?.thumbnail || item.images?.[0]?.url || "";

  return (
    <SectionScaffold
      h1={title}
      intro={undefined}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "References" }), url: `/${locale}/references` },
        { name: title, url: `/${locale}/references/${encodeURIComponent(slug!)}` },
      ]}
    >
      {hero ? (
        <div style={{ margin: "8px 0 14px" }}>
          <img
            src={hero}
            alt={title}
            width={900}
            height={360}
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
              background: "var(--card-bg, #0d0d0d)",
              borderRadius: 12,
              border: "1px solid var(--card-bright, rgba(255,255,255,.12))",
              padding: 12,
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
