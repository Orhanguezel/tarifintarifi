import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchLibraryBySlugServer } from "@/lib/library/api.server";
import type { ILibrary, TranslatedField } from "@/lib/library/types";

export const revalidate = 300;

// Helpers
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) => tf?.[locale] ?? "";
const clip = (s: string, n = 160) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// Safe i18n
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.library" });
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

// Next 15 types
type ParamsP = Promise<{ locale: string; slug?: string }>;
type SearchP = Promise<Record<string, string | string[] | undefined>>;

// Metadata
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
      path: `/${locale}/library`,
      title: t("title", { default: "Library" }),
      description: t("desc", { default: "Technical documents and resources." }),
    });
  }

  const item: ILibrary | null = await fetchLibraryBySlugServer(slug, locale);
  if (!item) {
    return basicMeta({
      locale,
      path: `/${locale}/library/${encodeURIComponent(slug)}`,
      title: t("title", { default: "Library" }),
      description: t("desc", { default: "Technical documents and resources." }),
    });
  }

  const title = pickStrict(item.title, locale) || item.slug;
  const summary = pickStrict(item.summary, locale);

  return basicMeta({
    locale,
    path: `/${locale}/library/${encodeURIComponent(slug)}`,
    title,
    description: clip(summary) || t("desc", { default: "Technical documents and resources." }),
  });
}

// Page
export default async function LibraryDetailPage(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
) {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  if (!slug) redirect(`/${locale}/library`);
  if (!slugFromParams && slug) redirect(`/${locale}/library/${encodeURIComponent(slug)}`);

  const t = await getSafeT(locale);

  const item: ILibrary | null = await fetchLibraryBySlugServer(slug!, locale);
  if (!item) notFound();

  const title = pickStrict(item.title, locale) || item.slug;
  const summary = pickStrict(item.summary, locale);
  const content = pickStrict(item.content, locale);
  const hero =
    item.images?.[0]?.webp || item.images?.[0]?.thumbnail || item.images?.[0]?.url || "";

  return (
    <SectionScaffold
      h1={title}
      intro={summary || undefined}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "Library" }), url: `/${locale}/library` },
        { name: title, url: `/${locale}/library/${encodeURIComponent(slug!)}` },
      ]}
    >
      {hero ? (
        <div style={{ margin: "8px 0 14px" }}>
          <img
            src={hero}
            alt={title}
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

      {/* Dosya indirme/inceleme listesi (varsa) */}
      {Array.isArray(item.files) && item.files.length > 0 ? (
        <div style={{ margin: "12px 0 18px" }}>
          <h4 style={{ margin: "0 0 8px 0" }}>{t("files", { default: "Files" })}</h4>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {item.files.map((f) => (
              <li key={f._id || f.url} style={{ marginBottom: 6 }}>
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.name || f.url}
                </a>
                {f.type ? <span style={{ color: "#999" }}> — {f.type}</span> : null}
                {typeof f.size === "number" ? (
                  <span style={{ color: "#999" }}>
                    {" "}
                    — {(f.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
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
