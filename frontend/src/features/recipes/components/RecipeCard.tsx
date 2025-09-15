"use client";

import styled, { css } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Recipe, DietFlag, AllergenFlag } from "@/lib/recipes/types";
import { useTranslations } from "next-intl";

/* ---------- helpers ---------- */
const caloriesOf = (r: Recipe) => (r as any)?.calories ?? r.nutrition?.calories ?? undefined;

const DIET_ICON: Record<DietFlag, string> = {
  vegetarian: "🥕",
  vegan: "🌱",
  "gluten-free": "🌾✖",
  "lactose-free": "🥛✖",
};
const DIET_I18N_KEY: Record<DietFlag, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  "gluten-free": "glutenFree",
  "lactose-free": "lactoseFree",
};

const ALLERGEN_ICON: Record<AllergenFlag, string> = {
  gluten: "🌾", dairy: "🥛", egg: "🥚", nuts: "🌰",
  peanut: "🥜", soy: "🫘", sesame: "🟤", fish: "🐟", shellfish: "🦐",
};

type TFn = ReturnType<typeof useTranslations>;
function safeDietLabel(flag: DietFlag, t: TFn) {
  try { const key = DIET_I18N_KEY[flag] as any; const val = t(key); return typeof val === "string" ? val : flag; }
  catch { return flag; }
}

/** slug: locale -> en -> ilk bulunan -> canonical */
function resolveSlug(r: Recipe, locale: string): string {
  const raw = (r as any)?.slug;
  if (!raw) return r.slugCanonical || "";
  if (typeof raw === "string") return raw || r.slugCanonical || "";
  const loc = raw?.[locale];
  const en  = raw?.en || raw?.EN;
  const first = Object.values(raw || {}).find((v) => typeof v === "string" && v.trim());
  return (loc || en || (first as string) || r.slugCanonical || "").trim();
}

/** kapak görseli: thumbnail -> webp -> url */
function imageOf(r: Recipe): string | undefined {
  return r.images?.[0]?.thumbnail || r.images?.[0]?.webp || r.images?.[0]?.url || undefined;
}

/* ---------- component ---------- */
export default function RecipeCard({ r, locale }: { r: Recipe; locale: string }) {
  const router = useRouter();
  const tc = useTranslations("common");
  const td = useTranslations("difficulty");
  const tdiet = useTranslations("diet");
  const tAll = useTranslations("recipeDetail");

  const slug = resolveSlug(r, locale);
  const href = slug ? `/${locale}/recipes/${encodeURIComponent(slug)}` : "";

  const title =
    (r.title as any)?.[locale] || r.title?.tr || r.title?.en || r.slugCanonical || "Tarif";

  const calories = caloriesOf(r) ?? 300;
  const servings = r.servings ?? 4;
  const diffKey = (r.difficulty ?? "medium") as "easy" | "medium" | "hard";
  const likes = r.reactionTotals?.like ?? 0;
  const comments = r.commentCount ?? 0;
  const rating = Number.isFinite(r.ratingAvg) ? Number(r.ratingAvg) : 0;
  const showStats = !!(likes || comments || rating);

  const flags = (r.dietFlags || []) as DietFlag[];
  const allergenList = Array.from(new Set(((r.allergenFlags || []) as AllergenFlag[])));
  const MAX_ALRG = 5;
  const moreCount = Math.max(0, allergenList.length - MAX_ALRG);

  const cover = imageOf(r);
  const go = () => { if (href) router.push(href); };

  return (
    <Card
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : -1}
      onClick={href ? go : undefined}
      onKeyDown={href ? (e) => { if (e.key === "Enter") go(); } : undefined}
      aria-disabled={!href}
      data-disabled={!href || undefined}
    >
      <ImgBox $src={cover} aria-hidden>
        <Badge>{(r.totalMinutes ?? 40)} {tc("unit.minutesShort")}</Badge>

        {!!flags.length && (
          <FlagStack aria-hidden>
            {flags.slice(0, 4).map((f) => (
              <FlagPill key={f} title={safeDietLabel(f, tdiet)}>{DIET_ICON[f]}</FlagPill>
            ))}
          </FlagStack>
        )}

        {!!allergenList.length && (
          <AlrgStack aria-hidden>
            {allergenList.slice(0, MAX_ALRG).map((f) => (
              <AlrgBlock
                key={f}
                title={tAll(`allergens.${f}Contains`, {
                  default:
                    f === "gluten" ? "Gluten içerir" :
                    f === "dairy"  ? "Süt ürünü içerir" :
                    f === "egg"    ? "Yumurta içerir" :
                    f === "nuts"   ? "Kuruyemiş içerir" :
                    f === "peanut" ? "Yer fıstığı içerir" :
                    f === "soy"    ? "Soya içerir" :
                    f === "sesame" ? "Susam içerir" :
                    f === "fish"   ? "Balık içerir" :
                                     "Kabuklu deniz ürünü içerir"
                })}
                data-variant={f === "gluten" ? "warn" : "neutral"}
              >
                {ALLERGEN_ICON[f]}
              </AlrgBlock>
            ))}
            {moreCount > 0 && <MoreBlock>+{moreCount}</MoreBlock>}
          </AlrgStack>
        )}
      </ImgBox>

      <Body>
        <Title title={title}>{title}</Title>

        <Meta>
          <span>🔥 {calories} {tc("unit.kcal")}</span>
          <Dot />
          <span>👥 {servings} {tc("unit.servings")}</span>
          <Dot />
          <span>🎯 {td(diffKey)}</span>
        </Meta>

        <Divider style={{ visibility: showStats ? "visible" as const : "hidden" }} />
        <Stats style={{ visibility: showStats ? "visible" as const : "hidden" }}>
          <span>❤️ {likes}</span>
          <span>💬 {comments}</span>
          <span>⭐ {rating.toFixed(1)}</span>
        </Stats>

        <Actions>
          {href ? (
            <Link
              prefetch={false}
              href={href}
              aria-label={tc("actions.view")}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {tc("actions.view")}
            </Link>
          ) : (
            <span style={{ opacity: .6, cursor: "not-allowed" }} aria-disabled="true">
              {tc("actions.view")}
            </span>
          )}
        </Actions>
      </Body>
    </Card>
  );
}

/* ---------- styled ---------- */
const Card = styled.article`
  position: relative; background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  overflow: hidden; min-height: 320px; cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  &:hover{ transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.08);
    border-color: ${({ theme }) => theme.colors.borderHighlight}; }
  &:focus-visible{ outline:2px solid ${({ theme }) => theme.colors.primary}; outline-offset:2px; }
  &[data-disabled="true"]{ cursor: default; }
`;

const ImgBox = styled.div<{ $src?: string }>`
  position: relative; height: 140px;
  background: linear-gradient(180deg,#eef2f7 0%,#e8eef7 100%);
  ${({ $src }) => $src && css`
    background-image: url(${$src});
    background-size: cover;
    background-position: center;
  `}
`;

const FlagStack = styled.div`
  position: absolute; right: 10px; top: 44px;
  display: flex; flex-direction: column; gap: 6px; align-items: flex-end;
`;
const FlagPill = styled.span`
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: ${({ theme }) => theme.radii.circle};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: rgba(255,255,255,.85); backdrop-filter: blur(2px);
  font-size: 16px; color: ${({ theme }) => theme.colors.textSecondary};
`;

const AlrgStack = styled(FlagStack)` right: 14px; `;
const AlrgBlock = styled.span<{ "data-variant"?: "warn" | "neutral" }>`
  width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, "data-variant": v }) => v === "warn" ? "rgba(245,165,36,.55)" : theme.colors.borderLight};
  background: ${({ theme, "data-variant": v }) => v === "warn" ? theme.colors.warningBackground : "rgba(255,255,255,.9)"};
  backdrop-filter: blur(2px); font-size: 16px; color: ${({ theme }) => theme.colors.textSecondary};
`;
const MoreBlock = styled(AlrgBlock)` font-size: 12px; font-weight: 700; `;

const Body = styled.div` padding: 12px 14px 10px; `;
const Title = styled.h3`
  margin:0 0 6px; font-size:${({ theme }) => theme.fontSizes.md}; font-weight:700; color:${({ theme }) => theme.colors.text};
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:calc(1.35em * 2);
`;
const Meta = styled.div`
  display:flex; align-items:center; gap:8px; color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.sm}; min-height:1.6rem;
`;
const Dot = styled.span` width:4px; height:4px; background:${({ theme }) => theme.colors.border}; border-radius:50%; display:inline-block; `;
const Divider = styled.hr` border:none; border-top:1px solid ${({ theme }) => theme.colors.borderBright}; margin:10px 0; `;
const Stats = styled.div` display:flex; gap:14px; color:${({ theme }) => theme.colors.textSecondary}; font-size:${({ theme }) => theme.fontSizes.sm}; margin-bottom:6px; min-height:1.4rem; `;
const Actions = styled.div` a{ font-weight:600; color:${({ theme }) => theme.colors.accent}; text-decoration:none; } `;
const Badge = styled.span`
  position:absolute; top:10px; right:10px;
  background:${({ theme }) => theme.colors.inputBackground};
  border:1px solid ${({ theme }) => theme.colors.borderBright};
  color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.xsmall};
  padding:4px 8px; border-radius:${({ theme }) => theme.radii.pill};
`;
