// /home/orhan/Dokumente/tariftarif/frontend/src/app/[locale]/recipes/category/[slug]/view.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";

/* helpers */
const ts = (d?: string | Date | null) => (d ? new Date(d).getTime() : 0);
const caloriesOf = (r: Recipe) => (r as any)?.calories ?? r.nutrition?.calories ?? undefined;

const pretty = (tCats: ReturnType<typeof useTranslations>, k: string) => {
  try { const tx = tCats(`dynamic.${k}`); if (tx) return tx; } catch {}
  const s = k.replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};

export default function CategoryView({
  locale,
  catKey,
  items
}: {
  locale: SupportedLocale;
  catKey: string;            // ← dinamik
  items: Recipe[];
}) {
  const t = useTranslations("category");
  const tc = useTranslations("common");
  const td = useTranslations("difficulty");
  const tCats = useTranslations("categories");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => setPage(1), [catKey]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => ts(b.createdAt || b.updatedAt) - ts(a.createdAt || a.updatedAt)),
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const go = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <Wrap>
      <Head>
        <h1>{pretty(tCats, catKey)}</h1>
        <p>{t("count", { count: sorted.length })}</p>
      </Head>

      {sorted.length === 0 && <Empty>{t("empty")}</Empty>}

      <Cards>
        {pageItems.map((r) => {
          const slug = (r.slug as any)?.[locale] || r.slugCanonical;
          const title = (r.title as any)?.[locale] || r.title?.tr || "Tarif";
          const calories = caloriesOf(r) ?? 300;
          const servings = r.servings ?? 4;
          const diffKey = (r.difficulty ?? "medium") as "easy" | "medium" | "hard";

          return (
            <Card key={(r as any)._id || slug}>
              <Img aria-hidden />
              <Body>
                <Title>{title}</Title>
                <Meta>
                  <span>🔥 {calories} {tc("unit.kcal")}</span>
                  <Dot />
                  <span>👥 {servings} {tc("unit.servings")}</span>
                  <Dot />
                  <span>🎯 {td(diffKey)}</span>
                </Meta>
                <Actions>
                  <Link href={`/${locale}/recipes/${slug}`}>{tc("actions.view")}</Link>
                </Actions>
              </Body>
              <Badge>{(r.totalMinutes ?? 40)} {tc("unit.minutesShort")}</Badge>
            </Card>
          );
        })}
      </Cards>

      {totalPages > 1 && (
        <Pager aria-label={t("pagination.aria")}>
          <PageBtn onClick={() => go(page - 1)} disabled={current === 1}>←</PageBtn>
          <Pages>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageNumber key={p} onClick={() => go(p)} $active={p === current}>{p}</PageNumber>
            ))}
          </Pages>
          <PageBtn onClick={() => go(page + 1)} disabled={current === totalPages}>→</PageBtn>
        </Pager>
      )}
    </Wrap>
  );
}

/* styled (ufak isim değişikliği) */
const Wrap = styled.main`padding:6px 0 24px;`;
const Head = styled.header`
  display:flex; align-items:baseline; gap:10px; margin:8px 0 16px;
  h1{ margin:0; font-size:${({theme})=>theme.fontSizes.h2}; }
  p{ margin:0; color:${({theme})=>theme.colors.textSecondary}; }
`;
const Empty = styled.div`
  background:${({theme})=>theme.colors.inputBackgroundLight};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  color:${({theme})=>theme.colors.textSecondary};
  padding:14px; border-radius:${({theme})=>theme.radii.lg};
`;
const Cards = styled.div`
  display:grid; grid-template-columns:repeat(12,1fr); gap:16px;
  ${({theme})=>theme.media.mobile}{ grid-template-columns:1fr; }
  @media (min-width:769px){ &>article{ grid-column:span 4; } }
`;
const Card = styled.article`
  position:relative; background:${({theme})=>theme.colors.cardBackground};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  border-radius:${({theme})=>theme.radii.lg}; box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;
`;
const Img = styled.div`height:140px; background:linear-gradient(180deg,#eef2f7 0%,#e8eef7 100%);`;
const Body = styled.div`padding:12px 14px 10px;`;
const Title = styled.h3`margin:0 0 6px; font-size:${({theme})=>theme.fontSizes.md};`;
const Meta = styled.div`display:flex; align-items:center; gap:8px; color:${({theme})=>theme.colors.textSecondary}; font-size:${({theme})=>theme.fontSizes.sm};`;
const Dot = styled.span`width:4px;height:4px;background:${({theme})=>theme.colors.border};border-radius:50%;`;
const Actions = styled.div`margin-top:8px; a{font-weight:600; color:${({theme})=>theme.colors.accent};}`;
const Badge = styled.span`
  position:absolute; top:10px; right:10px;
  background:${({theme})=>theme.colors.inputBackground};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  color:${({theme})=>theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.xsmall};
  padding:4px 8px; border-radius:${({theme})=>theme.radii.pill};
`;
const Pager = styled.nav`display:flex; justify-content:center; gap:8px; margin-top:18px;`;
const PageBtn = styled.button`
  padding:8px 10px; border-radius:${({theme})=>theme.radii.md};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  background:${({theme})=>theme.colors.inputBackgroundLight};
  color:${({theme})=>theme.colors.textSecondary}; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed;}
`;
const Pages = styled.div`display:flex; gap:6px;`;
const PageNumber = styled.button<{ $active?: boolean }>`
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  background:${({$active,theme})=>$active?theme.colors.primaryTransparent:theme.colors.inputBackgroundLight};
  color:${({theme})=>theme.colors.text}; cursor:pointer;
`;
