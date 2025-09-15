// app/[locale]/ai/page.tsx (veya senin dosya yolun)
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";
import RecipeAIGenerator from "@/features/recipes/ui/RecipeAIGenerator";

type Params = { locale: SupportedLocale };

export async function generateMetadata({
  params,
}: {
  params: Promise<Partial<Params>>;
}) {
  const p = await params;
  const locale = (p?.locale ?? "tr") as SupportedLocale;

  const t = await getTranslations({ locale, namespace: "aiGen.head" });
  return { title: t("title") };
}

export default async function Page({
  params,
}: {
  params: Promise<Partial<Params>>;
}) {
  const p = await params;
  const locale = (p?.locale ?? "tr") as SupportedLocale;

  return (
    <div style={{ maxWidth: 860, margin: "16px auto", padding: "0 16px" }}>
      <RecipeAIGenerator locale={locale} />
    </div>
  );
}
