"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { useSubmitRecipeMutation } from "@/lib/recipes/api";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

/* ---------- helpers ---------- */
const tokenize = (raw: string) =>
  raw.split(/[,;\n]/g).map((s) => s.trim()).filter(Boolean);
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const toNum = (v: number | "" | undefined) =>
  v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v);

type ImageItem = {
  url: string;
  thumbnail: string;
  webp?: string;
  publicId?: string;
  alt?: string; // UI tek dilli; payload tüm dillere yayılacak
  source?: string;
};

export default function RecipeSubmitForm({
  locale = "tr" as SupportedLocale,
}: { locale?: SupportedLocale }) {
  const [submitRecipe, { isLoading, data, error }] = useSubmitRecipeMutation();

  const t = useTranslations("submitRecipe");

  // temel alanlar (kategori kaldırıldı)
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState<number | "">("");
  const [totalMinutes, setTotalMinutes] = useState<number | "">("");
  const [calories, setCalories] = useState<number | "">(""); // geriye dönük destek
  const [description, setDescription] = useState("");

  // satır tabanlı içerikler
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [tipsText, setTipsText] = useState(""); // BE: opsiyonel, satır satır ipuçları

  // mutfak ve etiketler (chip)
  const [cuisineDraft, setCuisineDraft] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // görseller
  const [images, setImages] = useState<ImageItem[]>([]);

  // besin değerleri (1 porsiyon) — BE: nutrition.*
  const [nCalories, setNCalories] = useState<number | "">("");
  const [nProtein, setNProtein] = useState<number | "">("");
  const [nCarbs, setNCarbs] = useState<number | "">("");
  const [nFat, setNFat] = useState<number | "">("");
  const [nFiber, setNFiber] = useState<number | "">("");
  const [nSodium, setNSodium] = useState<number | "">("");

  // hızlı ekleme (chip)
  const addCuisine = () => {
    const items = tokenize(cuisineDraft);
    if (items.length) setCuisines((a) => uniq([...a, ...items]));
    setCuisineDraft("");
  };
  const addTag = () => {
    const items = tokenize(tagDraft);
    if (items.length) setTags((a) => uniq([...a, ...items]));
    setTagDraft("");
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, which: "cuisine" | "tag") => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      which === "cuisine" ? addCuisine() : addTag();
    }
  };

  const addImage = () => setImages((arr) => [...arr, { url: "", thumbnail: "", alt: "" }]);
  const removeImage = (i: number) => setImages((arr) => arr.filter((_, idx) => idx !== i));
  const updateImage = (i: number, patch: Partial<ImageItem>) =>
    setImages((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const canSubmit =
    title.trim().length >= 3 &&
    ingredientsText.trim().length > 0 &&
    stepsText.trim().length > 0 &&
    !isLoading;

  const onSubmit = async () => {
    if (!canSubmit) return;

    // images payload — alt’ı API tipine uydur (tüm diller)
    const imgPayload = images
      .filter((x) => x.url && x.thumbnail)
      .map((x) => {
        const altMap = x.alt
          ? SUPPORTED_LOCALES.reduce((acc, lng) => {
              acc[lng] = lng === locale ? (x.alt as string) : "";
              return acc;
            }, {} as Record<SupportedLocale, string>)
          : undefined;

        return {
          url: x.url,
          thumbnail: x.thumbnail,
          webp: x.webp || undefined,
          publicId: x.publicId || undefined,
          alt: altMap,
          source: x.source || undefined,
        };
      });

    // nutrition payload — herhangi bir alan doluysa gönder
    const nutritionAnyFilled =
      nCalories !== "" || nProtein !== "" || nCarbs !== "" || nFat !== "" || nFiber !== "" || nSodium !== "";
    const nutritionPayload = nutritionAnyFilled
      ? {
          calories: toNum(nCalories),
          protein: toNum(nProtein),
          carbs: toNum(nCarbs),
          fat: toNum(nFat),
          fiber: toNum(nFiber),
          sodium: toNum(nSodium),
        }
      : undefined;

    try {
      await submitRecipe({
        locale,
        body: {
          title: title.trim(),
          // ❌ category gönderimi kaldırıldı — BE gerekirse otomatize edecek
          servings: servings === "" ? undefined : Number(servings),
          totalMinutes: totalMinutes === "" ? undefined : Number(totalMinutes),
          // BE geriye dönük calories (nutrition.calories'a da maplenir)
          calories: calories === "" ? undefined : Number(calories),
          // BE: opsiyonel "nutrition" nesnesi
          ...(nutritionPayload ? { nutrition: nutritionPayload as any } : {}),
          description: description ? description.trim() : undefined,
          ingredientsText,
          stepsText,
          // BE: opsiyonel "tipsText" (satır satır)
          ...(tipsText.trim() ? { tipsText: tipsText } : {}),
          images: imgPayload,
          cuisines: cuisines.length ? cuisines : undefined,
          tags: tags.length ? tags : undefined,
        } as any,
      }).unwrap();
    } catch {
      // hata mesajı aşağıda error üzerinden gösterilecek
    }
  };

  const created = (data as any)?.data as any | undefined;
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

  return (
    <Card>
      <Head>
        <div>
          <strong>{t("head.title")}</strong>
          <p className="sub">{t("head.subtitle")}</p>
        </div>
      </Head>

      <Grid>
        <FieldWide>
          <Label>{t("fields.title.label")}</Label>
          <Input
            placeholder={t("fields.title.placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Help>{t("fields.title.help")}</Help>
        </FieldWide>

        {/* kategori alanı çıkarıldı */}

        <Field>
          <Label>{t("fields.servings.label")}</Label>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder={t("fields.servings.placeholder")}
            value={servings}
            onChange={(e) => setServings(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>

        <Field>
          <Label>{t("fields.totalMinutes.label")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("fields.totalMinutes.placeholder")}
            value={totalMinutes}
            onChange={(e) => setTotalMinutes(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>

        <Field>
          <Label>{t("fields.calories.label")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("fields.calories.placeholder")}
            value={calories}
            onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>

        <FieldWide>
          <Label>{t("fields.description.label")}</Label>
          <TextArea
            rows={3}
            placeholder={t("fields.description.placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FieldWide>

        <FieldWide>
          <Label>{t("fields.ingredients.label")}</Label>
          <TextArea
            rows={6}
            placeholder={t("fields.ingredients.placeholder")}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
          />
          <Help>{t("fields.ingredients.help")}</Help>
        </FieldWide>

        <FieldWide>
          <Label>{t("fields.steps.label")}</Label>
          <TextArea
            rows={6}
            placeholder={t("fields.steps.placeholder")}
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
          />
          <Help>{t("fields.steps.help")}</Help>
        </FieldWide>

        {/* İpuçları */}
        <FieldWide>
          <SectionTitle>{t("tips.title")}</SectionTitle>
          <TextArea
            rows={4}
            placeholder={t("tips.placeholder")}
    value={tipsText}
    onChange={(e) => setTipsText(e.target.value)}
          />
        </FieldWide>

        {/* Besin değerleri (1 porsiyon) */}
        <FieldWide>
          <SectionTitle>{t("nutrition.title")}</SectionTitle>
        </FieldWide>

        <Field>
          <Label>{t("nutrition.calories")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="150"
            value={nCalories}
            onChange={(e) => setNCalories(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
        <Field>
          <Label>{t("nutrition.protein")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="5"
            value={nProtein}
            onChange={(e) => setNProtein(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
        <Field>
           <Label>{t("nutrition.carbs")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="20"
            value={nCarbs}
            onChange={(e) => setNCarbs(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
        <Field>
          <Label>{t("nutrition.fat")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="5"
            value={nFat}
            onChange={(e) => setNFat(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
        <Field>
          <Label>{t("nutrition.fiber")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="2"
            value={nFiber}
            onChange={(e) => setNFiber(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
        <Field>
          <Label>{t("nutrition.sodium")}</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="200"
            value={nSodium}
            onChange={(e) => setNSodium(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>

        {/* Mutfak / Cuisines */}
        <FieldWide>
          <Label>{t("fields.cuisines.label")}</Label>
          <TagRow>
            {cuisines.map((x) => (
              <Tag key={x} onClick={() => setCuisines((arr) => arr.filter((y) => y !== x))}>
                {x} <span aria-hidden>×</span>
              </Tag>
            ))}
            <TagInput
              placeholder={t("fields.cuisines.placeholder")}
              value={cuisineDraft}
              onChange={(e) => setCuisineDraft(e.target.value)}
              onKeyDown={(e) => onKey(e, "cuisine")}
            />
          </TagRow>
          <Help>{t("fields.cuisines.help")}</Help>
        </FieldWide>

        {/* Etiketler */}
        <FieldWide>
          <Label>{t("fields.tags.label")}</Label>
          <TagRow>
            {tags.map((x) => (
              <Tag key={x} onClick={() => setTags((arr) => arr.filter((y) => y !== x))}>
                {x} <span aria-hidden>×</span>
              </Tag>
            ))}
            <TagInput
              placeholder={t("fields.tags.placeholder")}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => onKey(e, "tag")}
            />
          </TagRow>
        </FieldWide>

        {/* Foot */}
        <Foot>
          <Small
            type="button"
            onClick={() => {
              setTitle("Fırınsız Domatesli Biberli Bulgur");
              // kategori örnek doldurma kaldırıldı
              setServings(4);
              setTotalMinutes(25);
              setCalories(380);
              setDescription("Pratik, hafif ve lezzetli bir akşam yemeği alternatifi.");
              setIngredientsText([
                "1 su bardağı pilavlık bulgur",
                "2 adet domates (rendelenmiş)",
                "1 adet yeşil biber (doğranmış)",
                "1 yemek kaşığı zeytinyağı",
                "1 çay kaşığı tuz",
                "1 çay kaşığı karabiber",
                "1 su bardağı sıcak su"
              ].join("\n"));
              setStepsText([
                "Zeytinyağını tencerede ısıtın, biberi kavurun.",
                "Domatesi ekleyin, 3-4 dk pişirin.",
                "Bulguru ekleyip karıştırın.",
                "Sıcak su, tuz ve karabiberi ekleyin.",
                "Kısık ateşte suyunu çekene kadar pişirin.",
                "Sıcak servis edin."
              ].join("\n"));
              setTipsText([
                "Bulguru eklemeden önce 1 dk kavurursanız tane tane olur.",
                "Domates çok suluysa su miktarını azaltın."
              ].join("\n"));
              setNCalories(380);
              setNProtein(9);
              setNCarbs(65);
              setNFat(8);
              setNFiber(6);
              setNSodium(420);
              setCuisines(["turkish"]);
              setTags(["az malzemeli", "fırınsız"]);
            }}
          >
            {t("buttons.fillExample")}
          </Small>

          <Primary type="button" onClick={onSubmit} disabled={!canSubmit}>
            {isLoading ? t("buttons.submit.loading") : t("buttons.submit.default")}
          </Primary>
        </Foot>

        {!!error && (
          <Note className="err" aria-live="polite">
            ❌ {(error as any)?.data?.message || t("notes.error")}
          </Note>
        )}

        {!!created && (
          <Note className="ok" aria-live="polite">
            ✅ {t("notes.success", { title: createdTitle })}
            {createdSlug && (
              <>
                {" • "}
                <NextLink href={createdSlug}>{t("notes.viewRecipe")}</NextLink>
              </>
            )}
          </Note>
        )}
      </Grid>
    </Card>
  );
}

/* ---------- styled (değişmedi) ---------- */

const Card = styled.section`
  background: ${({ theme }) => theme.cards.background};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: 12px;
  @media (min-width: 769px) { padding: 16px 18px; }
`;

const Head = styled.header`
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderBright};
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.textAlt};
  strong { font-size: ${({ theme }) => theme.fontSizes.lg }; }
  .sub { margin: 6px 0 0; font-size: ${({ theme }) => theme.fontSizes.sm }; color: ${({ theme }) => theme.colors.textSecondary }; }
`;

const Grid = styled.div`
  display: grid; gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  ${({ theme }) => theme.media.mobile} { grid-template-columns: 1fr; }
`;

const Field = styled.div`display: grid; gap: 6px;`;
const FieldWide = styled(Field)`grid-column: 1 / -1;`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Help = styled.p`
  margin: 2px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
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

const Select = styled.select`
  --bg: ${({ theme }) => theme.inputs.background};
  --bgF: ${({ theme }) => theme.colors.inputBackgroundFocus};
  --bd: ${({ theme }) => theme.inputs.border};
  --bdF: ${({ theme }) => theme.inputs.borderFocus};
  --tx: ${({ theme }) => theme.inputs.text};
  --ph: ${({ theme }) => theme.colors.placeholder};
  --sh: ${({ theme }) => theme.colors.shadowHighlight};
  --tr: ${({ theme }) => theme.transition.fast};
  --r: ${({ theme }) => theme.radii.lg};
  ${baseInput}
`;

const Input = styled.input`
  --bg: ${({ theme }) => theme.inputs.background};
  --bgF: ${({ theme }) => theme.colors.inputBackgroundFocus};
  --bd: ${({ theme }) => theme.inputs.border};
  --bdF: ${({ theme }) => theme.inputs.borderFocus};
  --tx: ${({ theme }) => theme.inputs.text};
  --ph: ${({ theme }) => theme.colors.placeholder};
  --sh: ${({ theme }) => theme.colors.shadowHighlight};
  --tr: ${({ theme }) => theme.transition.fast};
  --r: ${({ theme }) => theme.radii.lg};
  ${baseInput}
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 84px;
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

const TagRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  min-height: 40px;
  border: 1px solid ${({ theme }) => theme.inputs.border};
  background: ${({ theme }) => theme.inputs.background};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 6px;
`;

const Tag = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  background: ${({ theme }) => theme.colors.tagBackground};
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover { opacity: ${({ theme }) => theme.opacity.hover}; }
`;

const TagInput = styled.input`
  flex: 1; min-width: 160px; border: 0; outline: none;
  background: transparent; height: 28px;
  color: ${({ theme }) => theme.inputs.text};
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; }
`;

const SectionTitle = styled.h4`
  grid-column: 1 / -1; margin: 10px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textAlt};
`;

const Foot = styled.div`
  grid-column: 1 / -1;
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px;
`;

const Small = styled.button`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    border-color: ${({ theme }) => theme.colors.borderHighlight};
  }
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
  grid-column: 1 / -1;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  &.ok {
    background: ${({ theme }) => theme.colors.successBg};
    color: ${({ theme }) => theme.colors.textOnSuccess};
    border: 1px solid rgba(24,169,87,.2);
  }
  &.err {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.textOnDanger};
    border: 1px solid rgba(229,72,77,.22);
  }
`;

const NextLink = styled(Link)`
  color: ${({ theme }) => theme.colors.link};
  text-decoration: none;
  &:hover { text-decoration: underline; color: ${({ theme }) => theme.colors.linkHover}; }
`;
