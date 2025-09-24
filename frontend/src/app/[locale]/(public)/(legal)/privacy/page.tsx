import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;
type Params = { locale: SupportedLocale };

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("privacy.title")}</h1>
      <p>{t("privacy.intro")}</p>

      <h2>{t("privacy.sections.dataWeCollect.title")}</h2>
      <ul>
        <li>{t("privacy.sections.dataWeCollect.items.usage")}</li>
        <li>{t("privacy.sections.dataWeCollect.items.cookies")}</li>
        <li>{t("privacy.sections.dataWeCollect.items.optional")}</li>
      </ul>

      <h2>{t("privacy.sections.howWeUse.title")}</h2>
      <p>{t("privacy.sections.howWeUse.text")}</p>

      <h2>{t("privacy.sections.rights.title")}</h2>
      <p>{t("privacy.sections.rights.text")}</p>

      <p style={{ color: "#666" }}>{t("privacy.lastUpdated", { date: "2025-01-01" })}</p>
    </main>
  );
}
