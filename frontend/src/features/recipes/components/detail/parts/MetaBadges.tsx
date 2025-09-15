import { MetaRow, Badge } from "../shared/primitives";
import { useTranslations } from "next-intl";

export default function MetaBadges({
  minutes, servings, kcal, diffText, categoryLabel
}: { minutes?: number; servings?: number; kcal?: number; diffText?: string; categoryLabel?: string; }) {
  const tRD = useTranslations("recipeDetail");
  return (
    <MetaRow>
      {minutes !== undefined && <Badge>⏱️ {tRD("meta.minutes", { value: minutes })}</Badge>}
      {servings !== undefined && <Badge>👥 {tRD("meta.servings", { value: servings })}</Badge>}
      {kcal !== undefined && <Badge>🔥 {tRD("meta.kcal", { value: kcal })}</Badge>}
      {diffText && <Badge>📶 {diffText}</Badge>}
      {categoryLabel && <Badge>🥣 {categoryLabel}</Badge>}
    </MetaRow>
  );
}
