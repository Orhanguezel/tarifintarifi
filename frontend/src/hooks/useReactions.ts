"use client";

import { useMemo } from "react";
import {
  useGetSummaryQuery,
  useGetMyReactionsQuery,
  useToggleReactionMutation,
  useRateMutation
} from "@/lib/reactions/api";
import { useListRecipesQuery } from "@/lib/recipes/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import type { Recipe } from "@/lib/recipes/types";
import { EMOJI_TO_KEY } from "@/features/recipes/components/detail/shared/constants";

// FE kategori normalize — BE validator ile uyumlu
const normalizeCat = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function useReactions(recipeId: string, data: Recipe) {
  const { data: summary } = useGetSummaryQuery({ recipeId, breakdown: "kind+emoji" });
  const { data: mine } = useGetMyReactionsQuery({ recipeId });
  const [toggleReaction, { isLoading: toggling }] = useToggleReactionMutation();
  const [rate, { isLoading: ratingBusy }] = useRateMutation();

  const totals = useMemo(() => {
    const base = {
      like: data.reactionTotals?.like ?? 0,
      love: data.reactionTotals?.love ?? 0,
      yum:  data.reactionTotals?.yum  ?? 0,
      wow:  data.reactionTotals?.wow  ?? 0
    };
    const s = (summary as any)?.[recipeId];
    if (!s) return base;

    const like = Number(s.byKind?.LIKE ?? 0);
    let love = 0, yum = 0, wow = 0;
    for (const [emoji, count] of Object.entries(s.byEmoji || {})) {
      const key = EMOJI_TO_KEY[emoji as string];
      if (!key) continue;
      if (key === "love") love += Number(count || 0);
      else if (key === "yum") yum += Number(count || 0);
      else if (key === "wow") wow += Number(count || 0);
    }
    return { like, love, yum, wow };
  }, [summary, recipeId, data.reactionTotals]);

  const isLiked = !!mine?.find((r) => r.recipeId === recipeId && r.kind === "LIKE");
  const isLove  = !!mine?.find((r) => r.recipeId === recipeId && r.kind === "EMOJI" && r.emoji === "❤️");
  const isYum   = !!mine?.find((r) => r.recipeId === recipeId && r.kind === "EMOJI" && r.emoji === "😋");
  const isWow   = !!mine?.find((r) => r.recipeId === recipeId && r.kind === "EMOJI" && r.emoji === "🤩");
  const myRating = mine?.find((r) => r.recipeId === recipeId && r.kind === "RATING")?.value;

  const onToggle = (kind: "LIKE" | "EMOJI", emoji?: string) => {
    toggleReaction({ recipeId, kind, emoji }).catch(() => {});
  };
  const onRate = (v: number) => { rate({ recipeId, value: v }).catch(() => {}); };

  return { totals, isLiked, isLove, isYum, isWow, myRating, toggling, ratingBusy, onToggle, onRate };
}

export function useRelatedByCategory(locale: string, data: Recipe) {
  const cat = data.category ? normalizeCat(String(data.category)) : "";
  const { data: relatedInCategory } = useListRecipesQuery(
    cat
      ? {
          locale: locale as any,
          limit: 8,
          category: cat,
          fields: ["_id", "slugCanonical", "slug", "title"].join(",")
        }
      : (skipToken as any)
  );

  return useMemo(
    () =>
      (relatedInCategory || []).filter(
        (r) => (r as any)._id !== (data as any)._id && r.slugCanonical !== data.slugCanonical
      ),
    [relatedInCategory, data]
  );
}
