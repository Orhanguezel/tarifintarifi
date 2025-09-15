import { ChipBtn, Chip, Stars, Star, Row, Muted } from "../shared/primitives";
import type { Recipe } from "@/lib/recipes/types";
import { LOVE, YUM, WOW } from "../shared/constants";
import { useReactions } from "@/hooks/useReactions";
import { useTranslations } from "next-intl";

export default function ReactionsBar({ recipeId, data, tCommon }: { recipeId: string; data: Recipe; tCommon: any; }) {
  const tRD = useTranslations("recipeDetail");
  const { totals, isLiked, isLove, isYum, isWow, myRating, toggling, ratingBusy, onToggle, onRate } =
    useReactions(recipeId, data);

  return (
    <Row>
      <ChipBtn aria-pressed={isLiked} $active={isLiked} disabled={toggling} onClick={() => onToggle("LIKE")} title={tRD("reactions.like")}>
        ❤️‍🔥 <b>{totals.like}</b>
      </ChipBtn>
      <ChipBtn aria-pressed={isLove} $active={isLove} disabled={toggling} onClick={() => onToggle("EMOJI", LOVE)} title={tRD("reactions.love")}>
        {LOVE} <b>{totals.love}</b>
      </ChipBtn>
      <ChipBtn aria-pressed={isYum} $active={isYum} disabled={toggling} onClick={() => onToggle("EMOJI", YUM)} title={tRD("reactions.yum")}>
        {YUM} <b>{totals.yum}</b>
      </ChipBtn>
      <ChipBtn aria-pressed={isWow} $active={isWow} disabled={toggling} onClick={() => onToggle("EMOJI", WOW)} title={tRD("reactions.wow")}>
        {WOW} <b>{totals.wow}</b>
      </ChipBtn>

      <Stars aria-label={tRD("reactions.rateAria")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} type="button" onClick={() => onRate(n)} disabled={ratingBusy} $on={(myRating ?? 0) >= n} title={tRD("reactions.starTitle", { n })}>
            ★
          </Star>
        ))}
      </Stars>

      {data.ratingCount && data.ratingAvg ? (
        <Chip title={tRD("reactions.average")}>
          <span>⭐</span>
          <strong>{Number(data.ratingAvg.toFixed(1))}</strong>
          <Muted>({data.ratingCount})</Muted>
        </Chip>
      ) : null}
    </Row>
  );
}
