import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;
type Params = { locale: SupportedLocale };

export default async function TermsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("terms.title")}</h1>
      <p>{t("terms.intro")}</p>

      <h2>{t("terms.sections.use.title")}</h2>
      <p>{t("terms.sections.use.text")}</p>

      <h2>{t("terms.sections.content.title")}</h2>
      <p>{t("terms.sections.content.text")}</p>

      <h2>{t("terms.sections.limitation.title")}</h2>
      <p>{t("terms.sections.limitation.text")}</p>

      <p style={{ color: "#666" }}>{t("terms.lastUpdated", { date: "2025-01-01" })}</p>
    </main>
  );
}
