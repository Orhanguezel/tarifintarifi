"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter, useParams } from "next/navigation";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeTip, Translated } from "@/lib/recipes/types";
import {
  useAdminCreateRecipeMutation,
  useAdminUpdateRecipeMutation,
  useAdminPatchStatusMutation,
  useAdminReorderImagesMutation,
} from "@/lib/recipes/api.client";
import JSONEditor from "@/components/common/JSONEditor";
import ImageUploader, { type UploadImage } from "@/components/common/ImageUploader";

type Props = {
  mode: "create" | "edit";
  initial?: Recipe | null;
  onDone: () => void;
  onCancel: () => void;
};

const emptyTL: Translated = {};

export default function RecipeForm({ mode, initial, onDone, onCancel }: Props) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  // ---- temel state
  const [title, setTitle] = useState<Translated>(initial?.title ?? emptyTL);
  const [description, setDescription] = useState<Translated>(initial?.description ?? emptyTL);

  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [servings, setServings] = useState<number | undefined>(initial?.servings);
  const [prepMinutes, setPrep] = useState<number | undefined>(initial?.prepMinutes);
  const [cookMinutes, setCook] = useState<number | undefined>(initial?.cookMinutes);
  const [totalMinutes, setTotal] = useState<number | undefined>(initial?.totalMinutes);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | undefined>(initial?.difficulty ?? "easy");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "create") {
        const res = await createRecipe({
          data: {
            ...payloadBase,
            newFiles: files,
            existingImagesOrder: existingOrder,
          },
        }).unwrap();

        if (res?.id) router.replace(`/${locale}/admin/recipes/${res.id}/edit`);
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
    } catch {
      // basit hata: toast vb. eklenebilir
    }
  }

  async function togglePublish() {
    if (mode === "edit" && initial?._id) {
      try {
        const next = !isPublished;
        setPublished(next);
        await patchStatus({ id: initial._id, isPublished: next }).unwrap();
      } catch {
        setPublished((v) => !v);
      }
    }
  }

  return (
    <Form onSubmit={onSubmit}>
      <Row>
        <Col>
          <Label>Başlık (Çok dilli JSON)</Label>
          <JSONEditor label="" value={title} onChange={(v) => setTitle(v || {})} placeholder='{"tr":"...", "en":"..."}' />

          <Label>Açıklama (Çok dilli JSON)</Label>
          <JSONEditor label="" value={description} onChange={(v) => setDescription(v || {})} placeholder='{"tr":"..."}' />

          <Grid2>
            <Field>
              <Label>Kategori</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ör. main-course" />
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
                  onChange={() => {}}
                  onClick={(e) => {
                    e.preventDefault();
                    togglePublish();
                  }}
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
              <JSONEditor
                label=""
                value={cuisines}
                onChange={(v) => setCuisines(v || [])}
                placeholder='["turkish","mediterranean"]'
              />
            </Field>
            <Field>
              <Label>Etiketler (Translated[])</Label>
              <JSONEditor
                label=""
                value={tags}
                onChange={(v) => setTags(v || [])}
                placeholder='[{"tr":"kolay","en":"easy"}]'
              />
            </Field>
          </Grid2>

          <Grid2>
            <Field>
              <Label>Diyet Bayrakları (JSON array)</Label>
              <JSONEditor
                label=""
                value={dietFlags}
                onChange={(v) => setDietFlags(v || [])}
                placeholder='["vegetarian","gluten-free"]'
              />
            </Field>
            <Field>
              <Label>Alerjen Bayrakları (JSON array)</Label>
              <JSONEditor label="" value={allergenFlags} onChange={(v) => setAllergenFlags(v || [])} placeholder='["gluten","nuts"]' />
            </Field>
          </Grid2>

          <Label>
            Malzemeler ({'{'}name, amount, order{'}'}[])
          </Label>
          <JSONEditor
            label=""
            value={ingredients}
            onChange={(v) => setIngredients(v || [])}
            placeholder='[{"name":{"tr":"Un"},"amount":{"tr":"2 su b."},"order":0}]'
          />

          <Label>
            Adımlar ({'{'}order, text{'}'}[])
          </Label>
          <JSONEditor
            label=""
            value={steps}
            onChange={(v) => setSteps(v || [])}
            placeholder='[{"order":1,"text":{"tr":"Fırını ısıt."}}]'
          />

          <Label>
            Püf Noktaları ({'{'}order, text{'}'}[])
          </Label>
          <JSONEditor
            label=""
            value={tips}
            onChange={(v) => setTips(v || [])}
            placeholder='[{"order":1,"text":{"tr":"Oda sıcaklığında dinlendir."}}]'
          />
        </Col>

        <Col>
          <Label>Görseller</Label>
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
            <Btn type="submit" disabled={saving}>
              {mode === "create" ? "Oluştur" : "Kaydet"}
            </Btn>
            <BtnLight type="button" onClick={onCancel}>
              İptal
            </BtnLight>
          </Actions>
        </Col>
      </Row>
    </Form>
  );
}

/* ---- styled (classic theme) ---- */
const Form = styled.form`
  display: block;
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;
const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 14px;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
const Input = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
`;
const Select = styled.select`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
`;
const ToggleWrap = styled.div`
  display: flex;
  align-items: center;
`;
const Check = styled.input``;
const Spacer = styled.span`
  flex: 1;
`;
const Grid2 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
`;
const Grid3 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
  @media (max-width: 700px) {
    grid-template-columns: 1fr 1fr;
  }
`;
const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
`;
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
