import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { basicMeta } from "@/features/page/seo";
import { SectionScaffold } from "@/features/page/PageFactory";
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

import { fetchSparepartBySlugServer } from "@/lib/spareparts/api.server";
import type { ISparepart, TranslatedLabel } from "@/lib/spareparts/types";

export const revalidate = 300;

// Helpers
const pickStrict = (tf: TranslatedLabel | undefined, locale: SupportedLocale) => tf?.[locale] ?? "";
const clip = (s: string, n = 160) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// Safe i18n
type TFn = (key: string, values?: Record<string, any>) => string;
async function getSafeT(locale: SupportedLocale): Promise<TFn> {
  try {
    const t = await getTranslations({ locale, namespace: "pages.spareparts" });
    return (key, values) => {
      try {
        const out = (t as any)(key, values);
        return typeof out === "string" && out.trim() ? out : (values?.default ?? key);
      } catch {
        return values?.default ?? key;
      }
    };
  } catch {
    return (key, values) => values?.default ?? key;
  }
}

// Next 15
type ParamsP = Promise<{ locale: string; slug?: string }>;
type SearchP = Promise<Record<string, string | string[] | undefined>>;

// Metadata
export async function generateMetadata(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
): Promise<Metadata> {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  const t = await getSafeT(locale);

  if (!slug) {
    return basicMeta({
      locale,
      path: `/${locale}/spare-parts`,
      title: t("title", { default: "Spare Parts" }),
      description: t("desc", { default: "Compatible and original spare parts." }),
    });
  }

  const item = await fetchSparepartBySlugServer(slug, locale);
  if (!item) {
    return basicMeta({
      locale,
      path: `/${locale}/spare-parts/${encodeURIComponent(slug)}`,
      title: t("title", { default: "Spare Parts" }),
      description: t("desc", { default: "Compatible and original spare parts." }),
    });
  }

  const name = pickStrict(item.name, locale) || item.slug;
  const desc = pickStrict(item.description, locale);

  return basicMeta({
    locale,
    path: `/${locale}/spare-parts/${encodeURIComponent(slug)}`,
    title: name,
    description: clip(desc) || t("desc", { default: "Compatible and original spare parts." }),
  });
}

// Page
export default async function SparePartDetailPage(
  { params, searchParams }: { params: ParamsP; searchParams: SearchP }
) {
  const { locale: raw, slug: slugFromParams } = await params;
  const sp = await searchParams;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  const slug =
    slugFromParams ||
    (typeof sp.slug === "string" ? sp.slug : Array.isArray(sp.slug) ? sp.slug[0] : undefined);

  if (!slug) redirect(`/${locale}/spare-parts`);
  if (!slugFromParams && slug) redirect(`/${locale}/spare-parts/${encodeURIComponent(slug)}`);

  const t = await getSafeT(locale);

  const item: ISparepart | null = await fetchSparepartBySlugServer(slug!, locale);
  if (!item) notFound();

  const name = pickStrict(item.name, locale) || item.slug;
  const desc = pickStrict(item.description, locale);

  const hero =
    item.images?.[0]?.webp || item.images?.[0]?.thumbnail || item.images?.[0]?.url || "";

  const InfoRow = ({ label, value }: { label: string; value?: string | number | boolean }) =>
    value === undefined || value === "" ? null : (
      <div style={{ display: "flex", gap: 8, fontSize: 14, color: "#bbb" }}>
        <strong style={{ color: "#ddd", minWidth: 120 }}>{label}:</strong>
        <span>{String(value)}</span>
      </div>
    );

  return (
    <SectionScaffold
      h1={name}
      intro={desc || undefined}
      breadcrumbs={[
        { name: t("home", { default: "Home" }), url: `/${locale}` },
        { name: t("title", { default: "Spare Parts" }), url: `/${locale}/spare-parts` },
        { name, url: `/${locale}/spare-parts/${encodeURIComponent(slug!)}` },
      ]}
    >
      {hero ? (
        <div style={{ margin: "8px 0 14px" }}>
          <img
            src={hero}
            alt={name}
            width={900}
            height={540}
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid var(--card-bright, rgba(255,255,255,.12))",
            }}
            loading="eager"
          />
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        <InfoRow label={t("fields.brand", { default: "Brand" })} value={item.brand} />
        <InfoRow label={t("fields.price", { default: "Price" })} value={item.price} />
        <InfoRow label={t("fields.stock", { default: "Stock" })} value={item.stock} />
        <InfoRow
          label={t("fields.category", { default: "Category" })}
          value={
            typeof item.category === "string"
              ? item.category
              : pickStrict(item.category?.name as TranslatedLabel, locale)
          }
        />
        <InfoRow label={t("fields.material", { default: "Material" })} value={item.material} />
        <InfoRow
          label={t("fields.color", { default: "Color" })}
          value={Array.isArray(item.color) ? item.color.join(", ") : item.color}
        />
        <InfoRow label={t("fields.weight", { default: "Weight (kg)" })} value={item.weightKg} />
        <InfoRow label={t("fields.size", { default: "Size" })} value={item.size} />
        <InfoRow label={t("fields.power", { default: "Power (W)" })} value={item.powerW} />
        <InfoRow label={t("fields.voltage", { default: "Voltage (V)" })} value={item.voltageV} />
        <InfoRow
          label={t("fields.flowRate", { default: "Flow Rate (m³/h)" })}
          value={item.flowRateM3H}
        />
        <InfoRow
          label={t("fields.coolingCapacity", { default: "Cooling Capacity (kW)" })}
          value={item.coolingCapacityKw}
        />
        <InfoRow
          label={t("fields.isElectric", { default: "Electric" })}
          value={item.isElectric ? "✓" : "—"}
        />
      </div>
    </SectionScaffold>
  );
}
