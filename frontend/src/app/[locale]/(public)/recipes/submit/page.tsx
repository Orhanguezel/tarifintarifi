import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";
import RecipeSubmitForm from "@/features/recipes/ui/RecipeSubmitForm";

type Params = { locale: SupportedLocale };

// (opsiyonel) ISR
// export const revalidate = 60;

export async function generateMetadata(
  { params }: { params: Promise<Partial<Params>> }
) {
  const { locale: raw } = await params;
  const locale = (raw ?? (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) ?? "tr") as SupportedLocale;

  const t = await getTranslations({ locale, namespace: "submitRecipe.head" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function Page(
  { params }: { params: Promise<Partial<Params>> }
) {
  const { locale: raw } = await params;
  const locale = (raw ?? (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) ?? "tr") as SupportedLocale;

  return (
    <div style={{ maxWidth: 860, margin: "16px auto", padding: "0 16px" }}>
      <RecipeSubmitForm locale={locale} />
    </div>
  );
}
