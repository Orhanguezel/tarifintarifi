"use client";

import { CardBox, AsideTitle, RelatedList, RelatedLink } from "../../shared/primitives";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { useTranslations } from "next-intl";
import { useRelatedByTags } from "@/hooks/useRelatedRecipes";
// Kategori fallback sıkıntı çıkarıyordu; byTags boşsa hiç göstermiyoruz.
// İstersen tekrar ekleriz ama Recipe tipinde döndüğünden emin olup.

function resolveSlug(r: Recipe, locale: SupportedLocale): string {
  const raw = (r as any)?.slug;
  if (!raw) return r.slugCanonical || "";
  if (typeof raw === "string") return raw || r.slugCanonical || "";
  const loc = raw?.[locale];
  const en  = raw?.en || raw?.EN;
  const first = Object.values(raw || {}).find((v) => typeof v === "string" && String(v).trim());
  return String(loc || en || first || r.slugCanonical || "").trim();
}

function resolveTitle(r: Recipe, locale: SupportedLocale): string {
  const t = (r as any)?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  if (t && typeof t === "object") {
    const loc = t?.[locale];
    const tr  = t?.tr;
    const first = Object.values(t).find((v) => typeof v === "string" && String(v).trim());
    if (loc && String(loc).trim()) return String(loc).trim();
    if (tr  && String(tr).trim())  return String(tr).trim();
    if (first) return String(first).trim();
  }
  return r.slugCanonical || "Tarif";
}

export default function RelatedListCard({
  data,
  locale,
}: {
  data: Recipe;
  locale: SupportedLocale;
}) {
  const tRD = useTranslations("recipeDetail");

  const { items: byTags } = useRelatedByTags(locale, data, { limit: 6, perTagLimit: 10 });
  const items = (byTags || [])
    .filter(
      (r: Recipe) =>
        (r as any)._id !== (data as any)._id &&
        r.slugCanonical !== data.slugCanonical
    )
    .map((r) => ({ r, slug: resolveSlug(r, locale), title: resolveTitle(r, locale) }))
    .filter((x) => x.slug && x.title)       // sağlamlaştır
    .slice(0, 5);

  if (!items.length) return null;

  return (
    <CardBox>
      <AsideTitle>{tRD("sections.related", { default: "Benzer Tarifler" })}</AsideTitle>
      <RelatedList>
        {items.map(({ r, slug, title }) => (
          <li key={(r as any)._id || r.slugCanonical}>
            <RelatedLink prefetch={false} href={`/${locale}/recipes/${encodeURIComponent(slug)}`}>
              {title}
            </RelatedLink>
          </li>
        ))}
      </RelatedList>
    </CardBox>
  );
}
