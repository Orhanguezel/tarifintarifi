"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Recipe as RecipeType } from "@/lib/recipes/types";
import { tPick, buildJsonLd } from "./shared/utils";
import { Wrap, PageCard, Divider, ContentGrid, Article, Aside } from "./shared/primitives";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

import TopBreadcrumbs from "./parts/TopBreadcrumbs";
import Hero from "./parts/Hero";
import Title from "./parts/Title";
import MetaBadges from "./parts/MetaBadges";
import Description from "./parts/Description";
import Cuisines from "./parts/Cuisines";
import ReactionsBar from "./parts/ReactionsBar";
import StatsRow from "./parts/StatsRow";

import IngredientsCard from "./parts/cards/IngredientsCard";
import StepsCard from "./parts/cards/StepsCard";
import TipsCard from "./parts/cards/TipsCard";
import CommentsCard from "./parts/cards/CommentsCard";
import NutritionCard from "./parts/cards/NutritionCard";
import TagsCard from "./parts/cards/TagsCard";
import AllergenDietCard from "./parts/cards/AllergenDietCard";
import RelatedListCard from "./parts/cards/RelatedListCard";

/* helpers */
const prettyFromKey = (tCats: ReturnType<typeof useTranslations>, key?: string | null) => {
  const k = String(key || "").trim().toLowerCase();
  if (!k) return undefined;
  try {
    const tx = tCats(`dynamic.${k}`);
    if (tx) return tx;
  } catch {}
  const s = k.replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};

export default function RecipeDetailView({ data, locale }: { data: RecipeType; locale: string }) {
  const tRD = useTranslations("recipeDetail");
  const tDiff = useTranslations("difficulty");
  const tCats = useTranslations("categories");
  const tCommon = useTranslations("common");

  const title = tPick(data.title, locale) || data.slugCanonical;
  const desc = tPick(data.description, locale);

  const minutes = data.totalMinutes ?? (data.prepMinutes ?? 0) + (data.cookMinutes ?? 0);
  const servings = data.servings;
  const kcal = (data as any)?.calories ?? (data as any)?.nutrition?.calories ?? undefined;
  const diffText = data.difficulty ? tDiff(data.difficulty) : undefined;

  const safeLocale: SupportedLocale =
   (SUPPORTED_LOCALES as readonly string[]).includes(locale as any)
     ? (locale as SupportedLocale)
      : "en";

  // BE kategoriyi hangi isimle verirse (category/categorySlug/categoryKey) yakala
  const categoryKey =
    (data as any)?.category ??
    (data as any)?.categorySlug ??
    (data as any)?.categoryKey ??
    undefined;

  const categoryLabel = prettyFromKey(tCats, categoryKey);
  const recipeId = String((data as any)._id || (data as any).id || "");

  // SEO
  const jsonLd = buildJsonLd({ data, locale, title, desc, minutes, servings });

  const cuisines = data.cuisines || [];

  const ingredients = useMemo(
    () =>
      (data.ingredients || [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((i) => {
          const name = tPick(i.name as any, locale);
          const amt = tPick(i.amount as any, locale);
          return amt ? `${amt} ${name}` : name;
        }),
    [data.ingredients, locale]
  );

  const steps = useMemo(
    () =>
      (data.steps || [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => tPick(s.text as any, locale))
        .filter(Boolean),
    [data.steps, locale]
  );

  const tips = useMemo(
    () =>
      (data.tips || [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((tp) => tPick(tp.text as any, locale))
        .filter(Boolean),
    [data.tips, locale]
  );

  return (
    <Wrap>
      <PageCard>
        <TopBreadcrumbs
          locale={locale}
          categoryKey={categoryKey}
          categoryLabel={categoryLabel}
          title={title}
        />

        {!!data.images?.[0]?.url && (
          <Hero
            src={data.images[0].url}
            alt={tPick(data.images[0].alt as any, locale) || title}
          />
        )}

        <Title>{title}</Title>

        <MetaBadges
          minutes={minutes}
          servings={servings}
          kcal={kcal}
          diffText={diffText}
          categoryLabel={categoryLabel}
        />

        {desc && <Description>{desc}</Description>}
        {!!cuisines.length && <Cuisines locale={safeLocale} cuisines={cuisines} />}

        <ReactionsBar recipeId={recipeId} data={data} tCommon={tCommon} />
        <StatsRow data={data} />

        <Divider />

        <ContentGrid>
          <Article>
            <IngredientsCard tRD={tRD} items={ingredients} />
            <StepsCard tRD={tRD} items={steps} />
            {!!tips.length && <TipsCard tRD={tRD} items={tips} />}
            <CommentsCard recipeId={recipeId} />
          </Article>

          <Aside>
            {data.nutrition && Object.keys(data.nutrition).length > 0 && (
              <NutritionCard tRD={tRD} nutrition={data.nutrition as any} />
            )}
            {!!data.tags?.length && <TagsCard tRD={tRD} tags={data.tags} locale={locale} />}
            <AllergenDietCard data={data} locale={locale} />
            <RelatedListCard data={data} locale={safeLocale} />
          </Aside>
        </ContentGrid>
      </PageCard>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Wrap>
  );
}
