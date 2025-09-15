// app/[locale]/(legal)/privacy/page.tsx
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;

type Params = { locale: SupportedLocale };

export default async function PrivacyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params; // ⬅️
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>

      <h2>{t("sections.dataWeCollect.title")}</h2>
      <ul>
        <li>{t("sections.dataWeCollect.items.usage")}</li>
        <li>{t("sections.dataWeCollect.items.cookies")}</li>
        <li>{t("sections.dataWeCollect.items.optional")}</li>
      </ul>

      <h2>{t("sections.howWeUse.title")}</h2>
      <p>{t("sections.howWeUse.text")}</p>

      <h2>{t("sections.rights.title")}</h2>
      <p>{t("sections.rights.text")}</p>

      <p style={{ color: "#666" }}>
        {t("lastUpdated", { date: "2025-01-01" })}
      </p>
    </main>
  );
}
