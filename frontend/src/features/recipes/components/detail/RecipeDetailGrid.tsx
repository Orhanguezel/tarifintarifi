// src/features/recipes/components/detail/RecipeDetailGrid.tsx
// ❌ "use client" YOK (Server Component)

import styled from "styled-components";
import type { Recipe } from "@/lib/recipes/types";
import RecipeCard from "./RecipeDetailCard";

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
`;

export default function RecipeGrid({
  items,
  locale
}: {
  items: Recipe[];
  locale: string;
}) {
  return (
    <Grid>
      {items.map((r, i) => (
        <RecipeCard
          key={(r as any)._id || r.slugCanonical}
          r={r}
          locale={locale}
          isPriority={i < 2} // fold altında kalıyorsa false yapabilirsin
        />
      ))}
    </Grid>
  );
}
