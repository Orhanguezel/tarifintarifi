// app/[locale]/(legal)/terms/page.tsx
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;

type Params = { locale: SupportedLocale };

export default async function TermsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params; // ⬅️
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>

      <h2>{t("sections.use.title")}</h2>
      <p>{t("sections.use.text")}</p>

      <h2>{t("sections.content.title")}</h2>
      <p>{t("sections.content.text")}</p>

      <h2>{t("sections.limitation.title")}</h2>
      <p>{t("sections.limitation.text")}</p>

      <p style={{ color: "#666" }}>
        {t("lastUpdated", { date: "2025-01-01" })}
      </p>
    </main>
  );
}
