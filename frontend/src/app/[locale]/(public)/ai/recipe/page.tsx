// app/[locale]/ai/recipe/page.tsx  (Server Component)
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";
import RecipeAIGenerator from "@/features/recipes/ui/RecipeAIGenerator";

type Params = { locale: SupportedLocale };
// Next 15: params is a Promise
type RouteParams = Promise<Params>;

export async function generateMetadata(props: { params: RouteParams }) {
  const { locale: raw } = await props.params;
  const locale = (raw ?? "tr") as SupportedLocale;

  const t = await getTranslations({ locale, namespace: "aiGen.head" });
  return { title: t("title") };
}

export default async function Page(props: { params: RouteParams }) {
  const { locale: raw } = await props.params;
  const locale = (raw ?? "tr") as SupportedLocale;

  return (
    <div style={{ maxWidth: 860, margin: "16px auto", padding: "0 16px" }}>
      <RecipeAIGenerator locale={locale} />
    </div>
  );
}
