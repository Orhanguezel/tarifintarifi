"use client";

import styled from "styled-components";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";
import { useListRecipesQuery } from "@/lib/recipes/api.client";
import { prettyFromSlug } from "@/lib/strings";
import { normalizeCategoryKey, getCategoryIcon } from "@/lib/recipes/categories";

/* ---------- helpers ---------- */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

/* ---------- component ---------- */
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
      try {
        const tx = tCats(`dynamic.${k}`);
        if (tx) return tx;
      } catch {}
      return prettyFromSlug(k);
    },
    [tCats]
  );

  const limit = clamp(Number(sampleSize) || 120, 1, 120);

  // Sadece category alanı yeterli (payload küçük)
  const { data = [], isFetching, isLoading } = useListRecipesQuery({
    locale,
    limit,
    fields: "category",
  });

  const sample = (data as Array<Pick<Recipe, "category">>) ?? [];

  const topKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of sample) {
      const key = normalizeCategoryKey(r?.category) ?? null;
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k]) => k);
  }, [sample]);

  const loading = isFetching || isLoading;

  return (
    <Box aria-busy={loading} aria-live="polite">
      <Title $sm>{t("quick.title")}</Title>
      <Pills>
        {loading && topKeys.length === 0 ? (
          <SkeletonRow aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <i key={i} />
            ))}
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
                <span aria-hidden>{icon}</span>
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
  padding: 14px;
  margin-top: 18px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`;
const Title = styled.h3<{ $sm?: boolean }>`
  margin: 0 0 10px;
  font-size: ${({ $sm, theme }) => ($sm ? theme.fontSizes.md : theme.fontSizes.h3)};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
`;
const Pills = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;
const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
  &[aria-pressed="true"],
  &[data-selected="true"] {
    background: ${({ theme }) => theme.colors.primaryTransparent};
    border-color: ${({ theme }) => theme.colors.borderHighlight};
    color: ${({ theme }) => theme.colors.text};
  }
`;
const Clear = styled(Pill)`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
`;
const SkeletonRow = styled.div`
  display: inline-flex;
  gap: 10px;
  i {
    width: 84px;
    height: 34px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.06));
    background-size: 200% 100%;
    animation: shimmer 1.1s linear infinite;
    border: 1px solid ${({ theme }) => theme.colors.borderBright};
  }
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
