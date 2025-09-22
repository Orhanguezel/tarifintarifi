"use client";

import styled from "styled-components";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";
import { useListRecipesQuery } from "@/lib/recipes/api.client";
import { prettyFromSlug } from "@/lib/strings";
import { normalizeCategoryKey, getCategoryIcon } from "@/lib/recipes/categories";
import { AI_CATEGORY_KEYS } from "@/lib/recipes/categories";

/* ---------- helpers ---------- */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

export default function QuickCategories({
  locale,
  selected,
  onPick,
  onClear,
  sampleSize = 120,
}: {
  locale: SupportedLocale;
  selected: string | null;
  onPick: (k: string) => void;
  onClear: () => void;
  sampleSize?: number;
}) {
  const t = useTranslations("home");
  const tCats = useTranslations("categories");

  const titleOf = useMemo(
    () => (k: string) => {
      try { const tx = tCats(`dynamic.${k}`); if (tx) return tx; } catch {}
      return prettyFromSlug(k);
    },
    [tCats]
  );

  const limit = clamp(Number(sampleSize) || 120, 1, 120);

  const { data = [], isFetching, isLoading } = useListRecipesQuery({
    locale,
    limit,
    fields: "category,categoryKey,categorySlug",
  });

  const sample = (data as Array<Pick<Recipe, "category"> & Partial<{ categoryKey: string; categorySlug: string }>>) ?? [];
  const getRawCategory = (r: any): string | null =>
    (r?.category ?? r?.categoryKey ?? r?.categorySlug ?? null) as string | null;

  const topKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of sample) {
      const raw = getRawCategory(r);
      const key = normalizeCategoryKey(raw);
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const ranked = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    return (ranked.length ? ranked : AI_CATEGORY_KEYS).slice(0, 10);
  }, [sample]);

  const loading = isFetching || isLoading;

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) onClear(); else onPick(val);
  };

  return (
    <Box aria-busy={loading} aria-live="polite">
      <HeaderRow>
        <Title $sm>{t("quick.title")}</Title>
        {/* Mobilde select görünür, desktop’ta gizli kalır */}
        <MobileRow>
          <Select
            aria-label={t("quick.title")}
            value={selected ?? ""}
            onChange={handleSelect}
            disabled={loading || topKeys.length === 0}
          >
            <option value="">{t("quick.selectPlaceholder", { default: "Choose a category" })}</option>
            {topKeys.map((k) => (
              <option key={k} value={k}>{titleOf(k)}</option>
            ))}
          </Select>

          <ClearGhost
            type="button"
            onClick={onClear}
            disabled={!selected}
            aria-disabled={!selected}
          >
            {t("clear")}
          </ClearGhost>
        </MobileRow>
      </HeaderRow>

      {/* Desktop pills */}
      <Pills>
        {loading && topKeys.length === 0 ? (
          <SkeletonRow aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => <i key={i} />)}
          </SkeletonRow>
        ) : (
          topKeys.map((k) => {
            const label = titleOf(k);
            const icon = getCategoryIcon(k);
            const pressed = selected === k;
            return (
              <Pill
                key={k}
                type="button"
                onClick={() => onPick(k)}
                aria-pressed={pressed}
                aria-label={label}
                title={label}
                data-selected={pressed ? "true" : "false"}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Pill>
            );
          })
        )}

        {selected && (
          <Clear type="button" onClick={onClear}>
            {t("clear")}
          </Clear>
        )}
      </Pills>
    </Box>
  );
}

/* ---------- styled ---------- */
const Box = styled.section`
  background: ${({ theme }) => theme.colors.sectionBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px 14px;
  margin-top: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.cards?.shadow || "0 2px 10px rgba(0,0,0,.04)"};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
`;

const Title = styled.h3<{ $sm?: boolean }>`
  margin: 0 0 6px;
  font-size: ${({ $sm, theme }) => ($sm ? theme.fontSizes.md : theme.fontSizes.h3)};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.title};
`;

const MobileRow = styled.div`
  display: none;
  ${({ theme }) => theme.media?.mobile || "@media (max-width: 768px)"} {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }
`;

/* Şık native select (özel ok ikonlu, hover/focus renkleriyle) */
const Select = styled.select`
  flex: 1;
  min-height: 38px;
  padding: 8px 36px 8px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  appearance: none;

  /* Ok simgesi (data URI SVG) */
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%2399A3B0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;

  transition:
    background-color ${({ theme }) => theme.transition.fast},
    border-color ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.hoverBackground};
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
  }
  &:disabled {
    opacity: .6; cursor: not-allowed;
  }
`;

const ClearGhost = styled.button`
  min-height: 38px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  transition: background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryTransparent};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }
  &:disabled { opacity: .5; cursor: not-allowed; }
`;

/* Desktop pills (mobilde gizli) */
const Pills = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;

  ${({ theme }) => theme.media?.mobile || "@media (max-width: 768px)"} {
    display: none;
  }
`;

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  line-height: 1;

  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  transition:
    background .15s ease,
    border-color .15s ease,
    box-shadow .15s ease,
    transform .08s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.hoverBackground};
    border-color: ${({ theme }) => theme.colors.inputBorder};
  }
  &:active { transform: translateY(1px); }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }

  &[aria-pressed="true"],
  &[data-selected="true"] {
    background: ${({ theme }) => theme.colors.primaryTransparent};
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    color: ${({ theme }) => theme.colors.text};
  }

  span[aria-hidden="true"] { display: inline-flex; }
`;

const Clear = styled(Pill)`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover {
    background: ${({ theme }) => theme.colors.primaryTransparent};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }
`;

const SkeletonRow = styled.div`
  display: inline-flex;
  gap: 8px;
  i {
    width: 90px;
    height: 36px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.skeletonBackground},
      ${({ theme }) => theme.colors.skeleton},
      ${({ theme }) => theme.colors.skeletonBackground}
    );
    background-size: 200% 100%;
    animation: shimmer 1.1s linear infinite;
    border: 1px solid ${({ theme }) => theme.colors.borderBright};
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
