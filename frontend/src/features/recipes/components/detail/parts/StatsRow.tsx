"use client";

import { useTranslations } from "next-intl";
import type { Recipe as RecipeType } from "@/lib/recipes/types";
import { Stats, StatItem } from "../shared/primitives";

type Props = { data: RecipeType };

export default function StatsRow({ data }: Props) {
  const tc = useTranslations("common"); // sadece common

  // Öncelik: totalMinutes varsa sadece onu göster
  if (typeof data.totalMinutes === "number") {
    return (
      <Stats>
        <StatItem>
          🕒 {data.totalMinutes} {tc("unit.minutesShort")}
        </StatItem>
      </Stats>
    );
  }

  // total yoksa: prep ve cook (var olanları sırayla)
  const hasPrep = typeof data.prepMinutes === "number";
  const hasCook = typeof data.cookMinutes === "number";

  if (!hasPrep && !hasCook) return null;

  return (
    <Stats>
      {hasPrep && (
        <StatItem>
          ⏳ {data.prepMinutes} {tc("unit.minutesShort")}
        </StatItem>
      )}
      {hasCook && (
        <StatItem>
          🍳 {data.cookMinutes} {tc("unit.minutesShort")}
        </StatItem>
      )}
    </Stats>
  );
}
