// src/features/recipes/components/RecipeGrid.tsx
// ❌ "use client" YOK (Server Component)

import styled from "styled-components";
import RecipeCard from "./RecipeCard";
import type { Recipe } from "@/lib/recipes/types";

export default function RecipeGrid({ items, locale }: { items: Recipe[]; locale: string }) {
  return (
    <Grid>
      {items.map((r, i) => (
        <RecipeCard
          key={(r as any)._id || r.slugCanonical}
          r={r}
          locale={locale}
          // İlk 3 kart: üstte görünme olasılığı yüksek → LCP iyileşir
          isPriority={i < 3}
        />
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px;
  ${({ theme }) => theme.media.mobile} { grid-template-columns: 1fr; }
  @media (min-width: 769px) { & > article { grid-column: span 4; } }
`;
