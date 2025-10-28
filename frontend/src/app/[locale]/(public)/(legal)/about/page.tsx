// src/app/[locale]/(legal)/about/page.tsx
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;

type Params = { locale: SupportedLocale };

export default async function AboutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params; // ⬅️ önemli: await
  const t = await getTranslations({ locale, namespace: "legal.about" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      <h2>{t("mission.title")}</h2>
      <p>{t("mission.text")}</p>
      <h2>{t("team.title")}</h2>
      <p>{t("team.text")}</p>
      <p style={{ color: "#666" }}>{t("lastUpdated", { date: "2025-01-01" })}</p>
    </main>
  );
}
