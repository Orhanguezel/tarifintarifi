// app/[locale]/(public)/contact/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;
type Params = Promise<{ locale: string }>;
const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.CONTACT_EMAIL || "support@ensotek.com").trim();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return basicMeta({
    locale, path: `/${locale}/contact`,
    title: t("title", { default: "Contact" }),
    description: t("desc", { default: "Get in touch with us." })
  });
}

export default async function ContactPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.contact" });

  return (
    <SectionScaffold
      h1={t("title", { default: "Contact" })}
      intro={t("intro", { default: "We’ll be glad to hear from you." })}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "Contact" }), url: `/${locale}/contact` },
      ]}
    >
      <ul>
        <li>{t("email", { default: "E-mail" })}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
        <li>{t("address", { default: "Address" })}: {t("addressText", { default: "Istanbul, Türkiye" })}</li>
      </ul>
    </SectionScaffold>
  );
}
