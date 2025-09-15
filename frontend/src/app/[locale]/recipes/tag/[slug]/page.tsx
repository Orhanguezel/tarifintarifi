import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";
import { prettyFromSlug, decodeQueryValue } from "@/lib/strings";
import { listRecipesByTagPaged } from "@/lib/recipes/api.server";
import TagView from "./view";

export const dynamic = "force-dynamic"; // opsiyonel güvenlik
export const revalidate = 600;
export const dynamicParams = true;

type RouteParams = { locale: SupportedLocale; slug: string };
type RouteSearch = { hl?: string };
type PageProps = {
  params: RouteParams | Promise<RouteParams>;
  searchParams: RouteSearch | Promise<RouteSearch>;
};

function makeDisplayLabel(slug: string, hl?: string) {
  return hl ? decodeQueryValue(hl) : prettyFromSlug(slug);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { hl } = (await searchParams) ?? {};

  const tagKey = decodeURIComponent(slug);
  const displayLabel = makeDisplayLabel(tagKey, hl);

  let description = `${displayLabel} etiketiyle işaretlenmiş tarifler.`;
  try {
    const t = await getTranslations({ locale, namespace: "tagPage" });
    description = t("seoDesc", { tag: displayLabel });
  } catch {}

  return {
    title: displayLabel,
    description,
    alternates: { canonical: `/${locale}/recipes/tag/${encodeURIComponent(tagKey)}` },
    openGraph: { title: displayLabel, description }
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { hl } = (await searchParams) ?? {};
  const tagKey = decodeURIComponent(slug);
  const displayLabel = makeDisplayLabel(tagKey, hl);

  // ilk sayfayı meta ile çek
  const { items, meta } = await listRecipesByTagPaged(locale, tagKey, {
    revalidate,
    hl: displayLabel,
    page: 1,
    limit: Number(process.env.NEXT_PUBLIC_TAG_PAGE_SIZE ?? 12),
  });

  return (
    <div style={{ maxWidth: 1120, margin: "16px auto", padding: "0 16px" }}>
      {items.length === 0 ? (
        <div>
          <h1 style={{ margin: "16px 0" }}>{displayLabel}</h1>
          <p>Bu etiket için henüz tarif bulunamadı.</p>
        </div>
      ) : (
        <TagView
          locale={locale}
          tagKey={tagKey}
          displayLabel={displayLabel}
          initialItems={items}
          initialMeta={meta}
        />
      )}
    </div>
  );
}
