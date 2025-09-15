"use client";

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
      {items.map((r) => (
        <RecipeCard key={(r as any)._id || r.slugCanonical} r={r} locale={locale} />
      ))}
    </Grid>
  );
}
