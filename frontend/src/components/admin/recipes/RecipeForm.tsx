"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter, useParams } from "next/navigation";
import type {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  RecipeTip,
  Translated,
} from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import {
  useAdminCreateRecipeMutation,
  useAdminUpdateRecipeMutation,
  useAdminPatchStatusMutation,
  useAdminReorderImagesMutation,
} from "@/lib/recipes/api.client";
import JSONEditor from "@/components/common/JSONEditor";
import ImageUploader, { type UploadImage } from "@/components/common/ImageUploader";

/* ================= helpers ================= */

const LOCALES =
  (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES?.split(",") as SupportedLocale[]) ||
  (["tr", "en"] as SupportedLocale[]);

const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0, 2).toLowerCase();
  return (LOCALES as ReadonlyArray<string>).includes(two as any)
    ? (two as SupportedLocale)
    : ("tr" as SupportedLocale);
};

function setTranslated(
  prev: Record<SupportedLocale, string> | undefined,
  locale: SupportedLocale,
  value: string
) {
  const base = (prev || {}) as Record<SupportedLocale, string>;
  const next = { ...base, [locale]: value };
  (Object.keys(next) as SupportedLocale[]).forEach((k) => {
    if (!next[k]) delete next[k];
  });
  return next;
}

// URL-safe slug üretimi
function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ================= component ================= */

type Props = {
  mode: "create" | "edit";
  initial?: Recipe | null;
  onDone: () => void;
  onCancel: () => void;
};

type EditMode = "simple" | "json";

export default function RecipeForm({ mode, initial, onDone, onCancel }: Props) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const uiLang = getUILang(locale);

  const [editMode, setEditMode] = useState<EditMode>("simple");

  // ---- temel state
  const [title, setTitle] = useState<Translated>(initial?.title ?? {});
  const [description, setDescription] = useState<Translated>(initial?.description ?? {});
  const [slugCanonical, setSlugCanonical] = useState<string>(initial?.slugCanonical ?? "");
  const [slug, setSlug] = useState<Translated>((initial?.slug as Translated) ?? {});

  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [servings, setServings] = useState<number | undefined>(initial?.servings);
  const [prepMinutes, setPrep] = useState<number | undefined>(initial?.prepMinutes);
  const [cookMinutes, setCook] = useState<number | undefined>(initial?.cookMinutes);
  const [totalMinutes, setTotal] = useState<number | undefined>(initial?.totalMinutes);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | undefined>(
    initial?.difficulty ?? "easy"
  );
  const [order, setOrder] = useState<number | undefined>(initial?.order ?? 0);
  const [isActive, setActive] = useState<boolean>(initial?.isActive ?? true);
  const [isPublished, setPublished] = useState<boolean>(initial?.isPublished ?? false);

  // JSON alanlar
  const [nutrition, setNutrition] = useState<any>(initial?.nutrition ?? undefined);
  const [cuisines, setCuisines] = useState<any>(initial?.cuisines ?? []);
  const [tags, setTags] = useState<any>(initial?.tags ?? []);
  const [allergens, setAllergens] = useState<any>(initial?.allergens ?? []);
  const [dietFlags, setDietFlags] = useState<any>(initial?.dietFlags ?? []);
  const [allergenFlags, setAllergenFlags] = useState<any>(initial?.allergenFlags ?? []);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(initial?.ingredients ?? []);
  const [steps, setSteps] = useState<RecipeStep[]>(initial?.steps ?? []);
  const [tips, setTips] = useState<RecipeTip[]>(initial?.tips ?? []);

  // medya
  const [existing, setExisting] = useState<UploadImage[]>(
    (initial?.images ?? []).map((i) => ({
      _id: undefined,
      url: i.url,
      thumbnail: i.thumbnail,
      webp: i.webp,
      publicId: i.publicId,
    }))
  );
  const [removedExisting, setRemovedExisting] = useState<UploadImage[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // ---- mutations ----
  const [createRecipe, createState] = useAdminCreateRecipeMutation();
  const [updateRecipe, updateState] = useAdminUpdateRecipeMutation();
  const [patchStatus, patchState] = useAdminPatchStatusMutation();
  const [reorderImages] = useAdminReorderImagesMutation();

  // toplam dakikayı hesapla
  useEffect(() => {
    if ((prepMinutes ?? 0) || (cookMinutes ?? 0)) {
      setTotal((prepMinutes || 0) + (cookMinutes || 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepMinutes, cookMinutes]);

  const saving = createState.isLoading || updateState.isLoading || patchState.isLoading;

  // mevcut görsellerin sırası → publicId || url
  const existingOrder = useMemo(
    () => existing.map((img) => img.publicId || img.url).filter(Boolean) as string[],
    [existing]
  );
  const removedKeys = useMemo(
    () => removedExisting.map((r) => r.publicId || r.url).filter(Boolean) as string[],
    [removedExisting]
  );

  const payloadBase: Partial<Recipe> = {
    slugCanonical: slugCanonical || undefined,
    slug: (slug && Object.keys(slug).length ? slug : undefined) as any,
    title,
    description,
    category: category || undefined,
    servings,
    prepMinutes,
    cookMinutes,
    totalMinutes,
    difficulty,
    order,
    isActive,
    isPublished,
    nutrition,
    cuisines,
    tags,
    allergens,
    dietFlags,
    allergenFlags,
    ingredients,
    steps,
    tips,
  };

  /* ====== SUBMIT ====== */
  async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (saving) return;

    try {
      if (mode === "create") {
        const res = await createRecipe({
          data: {
            ...payloadBase,
            newFiles: files,
            existingImagesOrder: existingOrder,
          },
        }).unwrap();

        const newId = (res as any)?.id;
        if (newId) router.replace(`/${locale}/admin/recipes/${newId}/edit`);
        onDone();
      } else if (mode === "edit" && initial?._id) {
        await updateRecipe({
          id: initial._id,
          data: {
            ...payloadBase,
            newFiles: files,
            existingImagesOrder: existingOrder,
            removedImageKeys: removedKeys,
          },
        }).unwrap();

        if (existingOrder.length && initial.images?.length) {
          await reorderImages({ id: initial._id, order: existingOrder }).unwrap().catch(() => {});
        }
        onDone();
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        err?.error ||
        err?.message ||
        "Kaydetme başarısız.";
      console.error("Recipe save failed:", err);
      alert(msg);
    }
  }

  async function togglePublish() {
    if (mode === "edit" && initial?._id) {
      try {
        const next = !isPublished;
        setPublished(next);
        await patchStatus({ id: initial._id, isPublished: next }).unwrap();
      } catch (e: any) {
        setPublished((v) => !v);
        const msg = e?.data?.message || e?.data?.error || e?.message || "Yayın durumunu güncelleyemedik.";
        alert(msg);
      }
    }
  }

  /* ====== JSON Kombine (başlık + açıklama) ====== */
  const combinedJSONValue = useMemo(
    () => ({ title, description }),
    [title, description]
  );
  const onCombinedJSONChange = (v: any) => {
    const toTL = (val: any, lang: SupportedLocale): Translated =>
      val && typeof val === "object" && !Array.isArray(val)
        ? (val as Translated)
        : val
        ? ({ [lang]: String(val) } as Translated)
        : ({});
    setTitle(toTL(v?.title, uiLang));
    setDescription(toTL(v?.description, uiLang));
  };

  /* ====== slug yardımcıları ====== */
  function autofillCurrentLocaleSlug() {
    const base = (title as any)?.[uiLang] || "";
    const s = slugify(base);
    setSlug((prev) => setTranslated(prev as any, uiLang, s));
  }

  /* ---------- render ---------- */
  return (
    <Form onSubmit={handleSubmit} autoComplete="off" noValidate>
      {/* Düzen Modu */}
      <ModeRow role="radiogroup" aria-label="Düzenleme modu">
        <ModeBtn
          type="button"
          aria-pressed={editMode === "simple"}
          $active={editMode === "simple"}
          onClick={() => setEditMode("simple")}
        >
          Basit
        </ModeBtn>
        <ModeBtn
          type="button"
          aria-pressed={editMode === "json"}
          $active={editMode === "json"}
          onClick={() => setEditMode("json")}
        >
          JSON
        </ModeBtn>
      </ModeRow>

      {/* ---- SLUGLAR ---- */}
      <BlockTitle>Adresler (Slug)</BlockTitle>

      <Label>Canonical Slug (dil bağımsız)</Label>
      <Input
        placeholder="ör. mercimek-corbasi"
        value={slugCanonical || ""}
        onChange={(e) => setSlugCanonical(slugify(e.target.value))}
      />
      <SmallRow>
        <small>
          Canonical slug boşsa arama motorları için dil bazlı slug’lar kullanılır.
          Canonical her dilde aynı ürünü temsil eden “genel” slug’dır.
        </small>
      </SmallRow>

      {editMode === "simple" ? (
        <>
          {/* SADECE GEÇERLİ DİLİN SLUG’U */}
          <Label>Slug ({uiLang})</Label>
          <Input
            placeholder={`slug (${uiLang})`}
            value={(slug as any)?.[uiLang] || ""}
            onChange={(e) =>
              setSlug((prev) => setTranslated(prev as any, uiLang, slugify(e.target.value)))
            }
          />
          <ButtonsRow>
            <BtnLight type="button" onClick={autofillCurrentLocaleSlug}>
              Bu dil için otomatik slug
            </BtnLight>
            <BtnLight type="button" onClick={() => setEditMode("json")}>
              Tüm dilleri düzenle (JSON)
            </BtnLight>
          </ButtonsRow>

          {/* Başlık / açıklama – sadece aktif dil */}
          <Label>Başlık ({uiLang})</Label>
          <Input
            placeholder={`Başlık (${uiLang})`}
            value={(title as any)?.[uiLang] || ""}
            onChange={(e) => setTitle((prev) => setTranslated(prev as any, uiLang, e.target.value))}
          />

          <Label>Açıklama ({uiLang})</Label>
          <Textarea
            placeholder={`Açıklama (${uiLang})`}
            value={(description as any)?.[uiLang] || ""}
            onChange={(e) =>
              setDescription((prev) => setTranslated(prev as any, uiLang, e.target.value))
            }
          />
        </>
      ) : (
        <>
          {/* JSON MODU: TÜM DİL SLUG’LARI */}
          <Label>Sluglar (JSON)</Label>
          <JSONEditor
            label=""
            value={slug}
            onChange={(v) => setSlug(v || {})}
            placeholder={JSON.stringify({ tr: "menemen", en: "turkish-scrambled-eggs" }, null, 2)}
          />

          {/* Başlık + açıklama JSON */}
          <Label>Başlık + Açıklama (JSON)</Label>
          <JSONEditor
            label=""
            value={combinedJSONValue}
            onChange={onCombinedJSONChange}
            placeholder={JSON.stringify({ title: { tr: "" }, description: { tr: "" } }, null, 2)}
          />
        </>
      )}

      <Grid2>
        <Field>
          <Label>Kategori</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ör. breakfast" />
        </Field>
        <Field>
          <Label>Sıra</Label>
          <Input type="number" value={order ?? 0} onChange={(e) => setOrder(Number(e.target.value))} />
        </Field>
      </Grid2>

      <Grid3>
        <Field>
          <Label>Porsiyon</Label>
          <Input
            type="number"
            value={servings ?? ""}
            onChange={(e) => setServings(e.target.value ? Number(e.target.value) : undefined)}
          />
        </Field>
        <Field>
          <Label>Hazırlık (dk)</Label>
          <Input
            type="number"
            value={prepMinutes ?? ""}
            onChange={(e) => setPrep(e.target.value ? Number(e.target.value) : undefined)}
          />
        </Field>
        <Field>
          <Label>Pişirme (dk)</Label>
          <Input
            type="number"
            value={cookMinutes ?? ""}
            onChange={(e) => setCook(e.target.value ? Number(e.target.value) : undefined)}
          />
        </Field>
        <Field>
          <Label>Toplam (dk)</Label>
          <Input
            type="number"
            value={totalMinutes ?? ""}
            onChange={(e) => setTotal(e.target.value ? Number(e.target.value) : undefined)}
          />
        </Field>
      </Grid3>

      <Grid2>
        <Field>
          <Label>Zorluk</Label>
          <Select value={difficulty ?? "easy"} onChange={(e) => setDifficulty(e.target.value as any)}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </Select>
        </Field>
        <Field>
          <Label>Durum</Label>
          <ToggleWrap>
            <Check type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} /> Aktif
            <Spacer />
            <Check
              type="checkbox"
              checked={isPublished}
              onClick={(e) => {
                e.preventDefault();
                togglePublish();
              }}
              onChange={() => {}}
            />{" "}
            Yayında
          </ToggleWrap>
        </Field>
      </Grid2>

      <Label>Besin Değerleri (JSON)</Label>
      <JSONEditor label="" value={nutrition} onChange={setNutrition} placeholder='{"calories":320,"protein":12}' />

      <Grid2>
        <Field>
          <Label>Mutfaklar (JSON array)</Label>
        </Field>
        <Field>
          <Label>Etiketler (Translated[])</Label>
        </Field>
      </Grid2>

      <Grid2>
        <JSONEditor
          label=""
          value={cuisines}
          onChange={(v) => setCuisines(v || [])}
          placeholder='["turkish","mediterranean"]'
        />
        <JSONEditor
          label=""
          value={tags}
          onChange={(v) => setTags(v || [])}
          placeholder='[{"tr":"kolay","en":"easy"}]'
        />
      </Grid2>

      <Grid2>
        <JSONEditor
          label="Diyet Bayrakları"
          value={dietFlags}
          onChange={(v) => setDietFlags(v || [])}
          placeholder='["vegetarian","gluten-free"]'
        />
        <JSONEditor
          label="Alerjen Bayrakları"
          value={allergenFlags}
          onChange={(v) => setAllergenFlags(v || [])}
          placeholder='["gluten","nuts"]'
        />
      </Grid2>

      <Label>Malzemeler ({'{'}name, amount, order{'}'}[])</Label>
      <JSONEditor
        label=""
        value={ingredients}
        onChange={(v) => setIngredients(v || [])}
        placeholder='[{"name":{"tr":"Un"},"amount":{"tr":"2 su b."},"order":0}]'
      />

      <Label>Adımlar ({'{'}order, text{'}'}[])</Label>
      <JSONEditor
        label=""
        value={steps}
        onChange={(v) => setSteps(v || [])}
        placeholder='[{"order":1,"text":{"tr":"Fırını ısıt."}}]'
      />

      <Label>Püf Noktaları ({'{'}order, text{'}'}[])</Label>
      <JSONEditor
        label=""
        value={tips}
        onChange={(v) => setTips(v || [])}
        placeholder='[{"order":1,"text":{"tr":"Oda sıcaklığında dinlendir."}}]'
      />

      <BlockTitle>Görseller</BlockTitle>
      <ImageUploader
        existing={existing}
        onExistingChange={setExisting}
        removedExisting={removedExisting}
        onRemovedExistingChange={setRemovedExisting}
        files={files}
        onFilesChange={setFiles}
        maxFiles={12}
        accept="image/*"
        sizeLimitMB={15}
        helpText="webp önerilir"
      />

      <Actions>
        <BtnLight type="button" onClick={onCancel}>
          İptal
        </BtnLight>
        <Btn type="button" onClick={handleSubmit} disabled={saving} aria-busy={saving}>
          {mode === "create" ? "Oluştur" : "Kaydet"}
        </Btn>
      </Actions>
    </Form>
  );
}

/* ================= styled ================= */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.md};
`;
const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
const SmallRow = styled.div`
  margin: 4px 0 -2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
`;
const Textarea = styled.textarea`
  width: 100%;
  min-height: 92px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  resize: vertical;
`;
const Grid2 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const Grid3 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
  @media (max-width: 900px) { grid-template-columns: 1fr 1fr; }
`;
const ToggleWrap = styled.div`display: flex; align-items: center;`;
const Check = styled.input.attrs({ type: "checkbox" })``;
const Spacer = styled.span`flex: 1;`;
const BlockTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin: ${({ theme }) => theme.spacings.sm} 0;
`;
const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
`;
const ButtonsRow = styled(Actions)`justify-content: flex-start; margin-top: 8px;`;
const Btn = styled.button`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.button};
`;
const BtnLight = styled.button`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.buttons.secondary.background};
  color: ${({ theme }) => theme.buttons.secondary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
`;
const ModeRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.xs};
  align-items: center;
  margin: -4px 0 8px;
`;
const ModeBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) => ($active ? theme.colors.primaryLight : theme.colors.cardBackground)};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const Select = styled.select`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
`;
