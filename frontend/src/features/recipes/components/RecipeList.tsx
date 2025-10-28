"use client";

import styled from "styled-components";
import Link from "next/link";
import type { Recipe } from "@/lib/recipes/types";
import { useTranslations } from "next-intl";

const caloriesOf = (r: Recipe) => (r as any)?.calories ?? r.nutrition?.calories ?? undefined;

export default function RecipeList({ items, locale }: { items: Recipe[]; locale: string }) {
  const tc = useTranslations("common");

  return (
    <List>
      {items.map((r) => {
        const title =
          (r.title as any)?.[locale] || r.title?.tr || r.slugCanonical || "Tarif";
        const slug = (r.slug as any)?.[locale] || r.slugCanonical;
        const href = `/${locale}/recipes/${slug}`;
        const minutes = r.totalMinutes ?? 40;
        const calories = caloriesOf(r) ?? 300;
        const likes = r.reactionTotals?.like ?? 0;
        const comments = r.commentCount ?? 0;

        return (
          <Item key={(r as any)._id || slug}>
            <NextLink prefetch={false} href={href}>{title}</NextLink>
            <Meta>
              <span>⏱ {minutes} {tc("unit.minutesShort")}</span>
              <span>🔥 {calories} {tc("unit.kcal")}</span>
              <span>❤️ {likes}</span>
              <span>💬 {comments}</span>
            </Meta>
          </Item>
        );
      })}
    </List>
  );
}

/* styled (Taze Tarifler listesi ile aynı görünüm) */
const List = styled.div`display:grid; gap:10px; margin-top:10px;`;
const Item = styled.div`
  background:${({ theme }) => theme.colors.cardBackground};
  border:1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius:${({ theme }) => theme.radii.lg};
  padding:10px 12px;
  display:flex; justify-content:space-between; align-items:center;
  color:${({ theme }) => theme.colors.textLight};
  font-size:${({ theme }) => theme.fontSizes.sm};
  min-height:52px;
`;
const Meta = styled.div`display:flex; gap:14px; color:${({ theme }) => theme.colors.textSecondary};`;
const NextLink = styled(Link)`color:${({ theme }) => theme.colors.link}; &:hover{ text-decoration:underline; }`;
