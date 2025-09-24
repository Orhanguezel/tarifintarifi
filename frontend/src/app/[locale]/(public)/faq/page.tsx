// app/[locale]/(public)/about/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return basicMeta({
    locale, path: `/${locale}/about`,
    title: t("title", { default: "About" }),
    description: t("desc", { default: "About our company." })
  });
}

export default async function AboutPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.about" });

  return (
    <SectionScaffold
      h1={t("title", { default: "About" })}
      intro={t("intro", { default: "We provide industrial solutions and services." })}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "About" }), url: `/${locale}/about` },
      ]}
    >
      <p>{t("body", { default: "Company mission, team, capabilities…" })}</p>
    </SectionScaffold>
  );
}
