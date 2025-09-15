"use client";

import Link from "next/link";
import styled from "styled-components";
import { CardBox, AsideTitle, Tags } from "../../shared/primitives";
import { tPick } from "../../shared/utils";
import { toSlugSafe } from "@/lib/strings";

type Props = { tRD: (k: string) => string; tags: any[]; locale: string };

// Görünen label (locale öncelikli, sonra TR/EN/fallback)
function resolveTagLabel(tg: any, locale: string): string {
  if (!tg) return "";
  if (typeof tg === "string") return tg.trim();
  const cand =
    tPick(tg as any, locale) ||
    tg?.label?.[locale] ||
    tg?.name?.[locale] ||
    tg?.tr ||
    tg?.label?.tr ||
    tg?.name?.tr ||
    tg?.en ||
    tg?.label?.en ||
    tg?.name?.en ||
    tg?.name ||
    tg?.label;
  return typeof cand === "string" ? cand.trim() : "";
}

// Stabil key (locale’den bağımsız, URL’de kullanılacak tek değer)
function resolveTagKey(tg: any): string {
  if (!tg) return "";
  if (typeof tg === "string") return toSlugSafe(tg);

  // varsa doğrudan alanlardan al
  const direct =
    tg.key || tg.tagKey || tg.slug || tg.slugEN || tg.slugCanonical || tg.code;
  if (typeof direct === "string" && direct.trim()) return toSlugSafe(direct);

  // yoksa EN/isimlerden türet
  const en =
    tg.keyEN || tg.en || tg.EN || tg.english || tg?.name?.en || tg?.label?.en;
  const tr = tg.tr || tg?.name?.tr || tg?.label?.tr;
  const anyName = tg?.name || tg?.label;
  const first =
    (typeof en === "string" && en) ||
    (typeof tr === "string" && tr) ||
    (typeof anyName === "string" && anyName);
  return toSlugSafe(first || "");
}

export default function TagsCard({ tRD, tags, locale }: Props) {
  const items = Array.from(
    new Map(
      (tags ?? [])
        .map((tg) => {
          const label = resolveTagLabel(tg, locale);
          const key = resolveTagKey(tg);
          if (!label || !key) return null;
          return [key, { label, key }];
        })
        .filter(Boolean) as [string, { label: string; key: string }][]
    ).values()
  );

  if (!items.length) return null;

  return (
    <CardBox>
      <AsideTitle>{tRD("sections.tags")}</AsideTitle>
      <StyledTags>
        {items.map(({ label, key }) => (
          <TagChip
            key={`${key}-${label}`}
            href={`/${locale}/recipes/tag/${encodeURIComponent(key)}?hl=${encodeURIComponent(label)}`}
            rel="tag"
            title={label}
            prefetch={false}
            aria-label={label}
          >
            {label}
          </TagChip>
        ))}
      </StyledTags>
    </CardBox>
  );
}

/* ---- styles ---- */
const StyledTags = styled(Tags)`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) =>
    (theme as any).colors?.tagBackground ?? theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
  }
`;
