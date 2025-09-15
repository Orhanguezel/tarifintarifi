"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { useGenerateRecipePublicMutation } from "@/lib/recipes/api";
import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";

/* ----------------- helpers ----------------- */
const splitCsv = (s: string) =>
  s.split(/[,;\n]/g).map((x) => x.trim()).filter(Boolean);

export default function RecipeAIGenerator({ locale }: { locale: SupportedLocale }) {
  const tAI = useTranslations("aiGen");

  // Güvenli çeviri helper’ı
  const tx = (key: string, fallback: string) => {
    try {
      const v = tAI(key);
      return v || fallback;
    } catch {
      return fallback;
    }
  };

  const [generate, { isLoading, data, error }] = useGenerateRecipePublicMutation();

  // Minimal: sadece PROMPT
  const [prompt, setPrompt] = useState("");

  // Gelişmiş (opsiyonel)
  const [showAdv, setShowAdv] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [servings, setServings] = useState<number | "">("");
  const [maxMinutes, setMaxMinutes] = useState<number | "">("");
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [lactoseFree, setLactoseFree] = useState(false);
  const [includeCsv, setIncludeCsv] = useState("");
  const [excludeCsv, setExcludeCsv] = useState("");

  // i18n chips
  const chipKeys = [
    "chips.detail812",
    "chips.quick15",
    "chips.noOven",
    "chips.onePot",
    "chips.fewIngredients",
    "chips.notSpicy",
    "chips.budget",
    "chips.glutenFree"
  ] as const;
  const chips = chipKeys.map((k) => tAI(k));

  // i18n örnek promptlar (fallback TR metinleriyle)
  const samples = useMemo(
    () => [
      tx(
        "samples.s1",
        "Akşam yemeği için 4 kişilik, Türk mutfağından; et içermeyen ama proteinli; fırın yok; 30 dakikanın altında; detaylı 8–12 adım."
      ),
      tx(
        "samples.s2",
        "Glütensiz atıştırmalık; fırınsız; ekonomik; 20 dk; içinde nohut olsun; adımları net yaz."
      ),
      tx(
        "samples.s3",
        "Kahvaltı için; vejetaryen; tavada; az malzemeyle; 15 dk; peynirli seçenek; 8–12 adım lütfen."
      )
    ],
    [tAI]
  );

  const onGenerate = async () => {
    await generate({
      locale,
      body: {
        prompt: prompt || undefined,
        cuisine: cuisine || undefined,
        servings: servings === "" ? undefined : Number(servings),
        maxMinutes: maxMinutes === "" ? undefined : Number(maxMinutes),
        vegetarian,
        vegan,
        glutenFree,
        lactoseFree,
        includeIngredients: splitCsv(includeCsv),
        excludeIngredients: splitCsv(excludeCsv)
      }
    }).unwrap();
  };

  const created: Recipe | undefined = data?.data;

  const createdSlug = useMemo(() => {
    if (!created) return null;
    const s = created?.slug?.[locale] || created?.slugCanonical;
    return s ? `/${locale}/recipes/${s}` : null;
  }, [created, locale]);

  const createdTitle =
    created?.title?.[locale] ||
    created?.title?.tr ||
    created?.title?.en ||
    created?.slugCanonical ||
    "";

  const errMsg =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    "";

  return (
    <Card>
      <Head>
        <strong>{tAI("head.title")}</strong>
      </Head>

      {/* PROMPT alanı */}
      <FieldFull>
        <Label>{tAI("prompt.label")}</Label>
        <TextArea
          rows={5}
          placeholder={tx(
            "prompt.placeholder",
            'Ne istediğini kısa ama net yaz: "4 kişilik, Türk mutfağı; fırınsız; 25 dk; tavuk yok; detaylı 8–12 adım."'
          )}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {/* Örnek şablonlar */}
        <Samples>
          {samples.map((s) => (
            <SampleBtn key={s} onClick={() => setPrompt(s)}>{s}</SampleBtn>
          ))}
        </Samples>

        {/* Hızlı çipler */}
        <Chips>
          {chips.map((c) => (
            <Chip key={c} onClick={() => setPrompt((p) => (p ? `${p} • ${c}` : c))}>
              {c}
            </Chip>
          ))}
        </Chips>
      </FieldFull>

      {/* Gelişmiş (opsiyonel) */}
      <Adv>
        <AdvHeader onClick={() => setShowAdv((v) => !v)} data-open={showAdv}>
          <span>⚙ {tAI("advanced.title")}</span>
          <span aria-hidden>{showAdv ? "▲" : "▼"}</span>
        </AdvHeader>

        {showAdv && (
          <AdvBody>
            <Grid2>
              <Field>
                <Label>{tAI("fields.cuisine.label")}</Label>
                <Input
                  placeholder={tAI("fields.cuisine.placeholder")}
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                />
                <Help>{tAI("fields.cuisine.help")}</Help>
              </Field>

              <Field>
                <Label>{tAI("fields.servings")}</Label>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={tx("fields.servings.placeholder", "4")}
                  value={servings}
                  onChange={(e) => setServings(e.target.value ? Number(e.target.value) : "")}
                />
              </Field>

              <Field>
                <Label>{tAI("fields.maxMinutes")}</Label>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={tx("fields.maxMinutes.placeholder", "25")}
                  value={maxMinutes}
                  onChange={(e) => setMaxMinutes(e.target.value ? Number(e.target.value) : "")}
                />
              </Field>
            </Grid2>

            <Checks aria-label={tAI("checks.aria")}>
              <label>
                <input type="checkbox" checked={vegetarian} onChange={(e) => setVegetarian(e.target.checked)} /> {tAI("checks.vegetarian")}
              </label>
              <label>
                <input type="checkbox" checked={vegan} onChange={(e) => setVegan(e.target.checked)} /> {tAI("checks.vegan")}
              </label>
              <label>
                <input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} /> {tAI("checks.glutenFree")}
              </label>
              <label>
                <input type="checkbox" checked={lactoseFree} onChange={(e) => setLactoseFree(e.target.checked)} /> {tAI("checks.lactoseFree")}
              </label>
            </Checks>

            <Grid2>
              <Field>
                <Label>{tAI("include.labelSimple")}</Label>
                <Input
                  placeholder={tAI("include.placeholderSimple")}
                  value={includeCsv}
                  onChange={(e) => setIncludeCsv(e.target.value)}
                />
                <Help>{tAI("include.helpSimple")}</Help>
              </Field>

              <Field>
                <Label>{tAI("exclude.labelSimple")}</Label>
                <Input
                  placeholder={tAI("exclude.placeholderSimple")}
                  value={excludeCsv}
                  onChange={(e) => setExcludeCsv(e.target.value)}
                />
                <Help>{tAI("exclude.helpSimple")}</Help>
              </Field>
            </Grid2>
          </AdvBody>
        )}
      </Adv>

      <Foot>
        <Small
          type="button"
          onClick={() => {
            setPrompt('Akşam yemeği için 4 kişilik, Türk mutfağından; fırınsız; 25 dk; tavuk yok; detaylı 8–12 adım.');
            setCuisine("turkish");
            setServings(4);
            setMaxMinutes(25);
            setShowAdv(true);
          }}
        >
          {tAI("buttons.fillExample")}
        </Small>

        <Primary type="button" onClick={onGenerate} disabled={isLoading || !prompt.trim()}>
          {isLoading ? tAI("buttons.generate.loading") : tAI("buttons.generate.default")}
        </Primary>
      </Foot>

      {!!error && (
        <Note className="err" aria-live="polite">
          ❌ {errMsg || tAI("error.generic")}
        </Note>
      )}

      {!!created && (
        <Note className="ok" aria-live="polite">
          ✅ {tAI("success.created", { title: createdTitle })}
          {createdSlug && (
            <>
              {" • "}
              <NextLink href={createdSlug}>{tAI("success.viewLink")}</NextLink>
            </>
          )}
        </Note>
      )}
    </Card>
  );
}

/* ----------------- styled ----------------- */
const Card = styled.section`
  background: ${({ theme }) => theme.cards.background};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: 12px;
  @media (min-width: 769px) { padding: 16px 18px; }
`;

const Head = styled.header`
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderBright};
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.textAlt};
  strong { font-size: ${({ theme }) => theme.fontSizes.lg}; }
`;

const Field = styled.div`display: grid; gap: 6px;`;
const FieldFull = styled(Field)`grid-column: 1 / -1;`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 96px;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.inputs.border};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  outline: none;
  transition: border-color ${({ theme }) => theme.transition.fast};
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; }
  &:focus {
    border-color: ${({ theme }) => theme.inputs.borderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
`;

const baseInput = `
  width: 100%;
  height: 40px;
  border-radius: var(--r);
  padding: 0 12px;
  border: 1px solid var(--bd);
  background: var(--bg);
  color: var(--tx);
  outline: none;
  transition: border-color var(--tr), background var(--tr);
  &::placeholder { color: var(--ph); }
  &:focus {
    border-color: var(--bdF);
    box-shadow: var(--sh);
    background: var(--bgF);
  }
`;
const Input = styled.input`${baseInput}`;

const Chips = styled.div`display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;`;
const Chip = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 6px 10px; cursor: pointer; font-size: ${({ theme }) => theme.fontSizes.xsmall};
  &:hover { background: ${({ theme }) => theme.colors.inputBackgroundFocus }; }
`;

const Samples = styled.div`display: grid; gap: 6px; margin: 6px 0 2px;`;
const SampleBtn = styled.button`
  text-align: left;
  border: 1px dashed ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 10px; cursor: pointer; font-size: ${({ theme }) => theme.fontSizes.xsmall};
  &:hover { background: ${({ theme }) => theme.colors.inputBackgroundFocus}; }
`;

const Adv = styled.section`
  margin-top: 10px;
  border: 1px dashed ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
`;
const AdvHeader = styled.button`
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  &[data-open="true"] {
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    color: ${({ theme }) => theme.colors.text};
  }
`;
const AdvBody = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.cards.background};
  border-top: 1px dashed ${({ theme }) => theme.colors.borderBright};
  border-radius: 0 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg};
`;

const Grid2 = styled.div`
  display: grid; gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  ${({ theme }) => theme.media.mobile} { grid-template-columns: 1fr; }
`;

const Checks = styled.div`
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 6px 0 2px;
  label {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Help = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Foot = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: 12px;`;
const Small = styled.button`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.inputBackgroundFocus}; border-color: ${({ theme }) => theme.colors.borderHighlight}; }
`;
const Primary = styled.button`
  --bg: ${({ theme }) => theme.buttons.primary.background};
  --bgH: ${({ theme }) => theme.buttons.primary.backgroundHover};
  --tx: ${({ theme }) => theme.buttons.primary.text};
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  background: var(--bg);
  color: var(--tx);
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.button};
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover { background: var(--bgH); color: var(--tx); }
  &:disabled { opacity: .7; cursor: not-allowed; }
`;

const Note = styled.div`
  margin-top: 10px; padding: 10px 12px; border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  &.ok { background: ${({ theme }) => theme.colors.successBg}; color: ${({ theme }) => theme.colors.textOnSuccess}; border: 1px solid rgba(24,169,87,.2); }
  &.err { background: ${({ theme }) => theme.colors.dangerBg}; color: ${({ theme }) => theme.colors.textOnDanger}; border: 1px solid rgba(229,72,77,.22); }
`;
const NextLink = styled(Link)`
  color: ${({ theme }) => theme.colors.link};
  text-decoration: none;
  &:hover { text-decoration: underline; color: ${({ theme }) => theme.colors.linkHover}; }
`;
