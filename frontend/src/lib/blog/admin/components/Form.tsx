"use client";
import styled from "styled-components";
import { useMemo, useState, useEffect } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/blog/locales";
import type { IBlog, BlogCategory, IBlogImage } from "@/modules/blog/types";
import type { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES, getMultiLang } from "@/types/common";
import { JSONEditor, ImageUploader } from "@/shared";

type TL = Partial<Record<SupportedLocale, string>>;
type UploadImage = { url: string; thumbnail?: string; webp?: string; publicId?: string };

const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(two)
    ? (two as SupportedLocale)
    : ("tr" as SupportedLocale);
};
const setTL = (obj: TL | undefined, l: SupportedLocale, val: string): TL => ({ ...(obj || {}), [l]: val });
const getTLStrict = (obj?: TL, l?: SupportedLocale) => (l ? (obj?.[l] ?? "") : "");
const toTL = (v: any, lang: SupportedLocale): TL =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as TL) : v ? ({ [lang]: String(v) } as TL) : {};

type Props = {
  categories: BlogCategory[];
  initial?: IBlog | null;
  onSubmit: (formData: FormData, id?: string) => Promise<void> | void;
  onCancel: () => void;
  onAddCategory: () => void;
};

export default function BlogForm({ categories, initial, onSubmit, onCancel, onAddCategory }: Props) {
  const { t, i18n } = useI18nNamespace("blog", translations);
  const lang = useMemo<SupportedLocale>(() => getUILang(i18n?.language), [i18n?.language]);
  const isEdit = Boolean(initial?._id);

  const [editMode, setEditMode] = useState<"simple" | "json">("simple");

  // --- basic
  const [slug, setSlug] = useState<string>(initial?.slug || "");
  const [title, setTitle] = useState<TL>((initial?.title as TL) || {});
  const [summary, setSummary] = useState<TL>((initial?.summary as TL) || {});
  const [content, setContent] = useState<TL>((initial?.content as TL) || {});
  const [tags, setTags] = useState<string>(Array.isArray(initial?.tags) ? initial!.tags.join(", ") : "");
  const [order, setOrder] = useState<number>(Number(initial?.order ?? 0));
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [isPublished, setIsPublished] = useState<boolean>(initial?.isPublished ?? false);

  // --- category (string | {_id} | {$oid})
  const initialCategoryId =
    typeof initial?.category === "string"
      ? initial.category
      : (initial?.category as any)?._id || (initial?.category as any)?.$oid || "";
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || "");

  // --- images (STABLE kaynak + senkronizasyon)
  const originalExisting = useMemo<IBlogImage[]>(
    () => ((initial?.images || []) as IBlogImage[]),
    [initial?.images]
  );

  const [existingUploads, setExistingUploads] = useState<UploadImage[]>(
    () =>
      originalExisting.map((img) => ({
        url: img.url,
        thumbnail: img.thumbnail,
        webp: img.webp,
        publicId: img.publicId,
      }))
  );
  const [removedExisting, setRemovedExisting] = useState<UploadImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // initial değişince görsel durumlarını yenile
  useEffect(() => {
    setExistingUploads(
      originalExisting.map((img) => ({
        url: img.url,
        thumbnail: img.thumbnail,
        webp: img.webp,
        publicId: img.publicId,
      }))
    );
    setRemovedExisting([]);
    setNewFiles([]);
  }, [originalExisting]);

  // id eşlemesi (url/publicId -> _id)
  const idBySig = useMemo(() => {
    const m = new Map<string, string>();
    for (const img of originalExisting) {
      if (img._id) {
        if (img.publicId) m.set(`pid:${img.publicId}`, img._id);
        if (img.url) m.set(`url:${img.url}`, img._id);
      }
    }
    return m;
  }, [originalExisting]);

  // helpers
  const categoriesOpts = useMemo(
    () =>
      (categories || []).map((c) => ({
        id: c._id,
        label: getMultiLang(c.name as any, lang) || c.slug || String(c._id),
      })),
    [categories, lang]
  );

  // Tek JSON ile düzenleme
  const combinedJSONValue = useMemo(() => ({ title, summary, content }), [title, summary, content]);
  const onCombinedJSONChange = (v: any) => {
    setTitle(toTL(v?.title, lang));
    setSummary(toTL(v?.summary, lang));
    setContent(toTL(v?.content, lang));
  };

  // submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    fd.append("slug", slug || "");
    fd.append("isActive", String(isActive));
    fd.append("isPublished", String(isPublished));
    fd.append("order", String(Number(order) || 0));
    if (categoryId) fd.append("category", categoryId);

    (tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((tg) => fd.append("tags[]", tg));

    fd.append("title", JSON.stringify(title || {}));
    fd.append("summary", JSON.stringify(summary || {}));
    fd.append("content", JSON.stringify(content || {}));

    newFiles.forEach((file) => fd.append("images", file));

    // kaldırılan mevcutlar
    const removeIds: string[] = [];
    removedExisting.forEach((img) => {
      const id = (img.publicId && idBySig.get(`pid:${img.publicId}`)) || (img.url && idBySig.get(`url:${img.url}`));
      if (id) removeIds.push(id);
    });
    removeIds.forEach((id) => fd.append("removeImageIds[]", id));

    if (removedExisting.length) {
      // 🔴 ÖNEMLİ: backend 'removedImages' bekliyor
      fd.append(
        "removedImages",
        JSON.stringify(removedExisting.map((x) => ({ publicId: x.publicId, url: x.url })))
      );
    }

    if (existingUploads.length) {
      const orderSig = existingUploads.map((x) => x.publicId || x.url).filter(Boolean) as string[];
      fd.append("existingImagesOrder", JSON.stringify(orderSig));
    }

    if (isEdit && initial?._id) await onSubmit(fd, initial._id);
    else await onSubmit(fd);
  };

  const placeholderObj = useMemo(() => {
    const langs = SUPPORTED_LOCALES as SupportedLocale[];
    const empty = Object.fromEntries(langs.map((l) => [l, ""])) as TL;
    return JSON.stringify({ title: empty, summary: empty, content: empty }, null, 2);
  }, []);

  return (
    <Form onSubmit={handleSubmit}>
      {/* Üst Alanlar */}
      <Row>
        <Col>
          <Label>{t("slug", "Slug")}</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t("slug_ph", "ornek-slug")} />
        </Col>

        <Col>
          <Label>{t("category", "Category")}</Label>
          <FlexRow>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t("selectCategory", "Select category")}</option>
              {categoriesOpts.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </Select>
            <Small type="button" onClick={onAddCategory}>+ {t("newCategory", "New Category")}</Small>
          </FlexRow>
        </Col>

        <Col>
          <Label>{t("order", "Order")}</Label>
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
        </Col>

        <Col>
          <Label>{t("isActive", "Active?")}</Label>
          <CheckRow>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>{isActive ? t("yes", "Yes") : t("no", "No")}</span>
          </CheckRow>
        </Col>
      </Row>

      {/* Düzen Modu */}
      <ModeRow role="radiogroup" aria-label={t("editMode","Edit Mode")}>
        <ModeBtn type="button" aria-pressed={editMode === "simple"} $active={editMode === "simple"} onClick={() => setEditMode("simple")}>
          {t("simpleMode", "Basit")}
        </ModeBtn>
        <ModeBtn type="button" aria-pressed={editMode === "json"} $active={editMode === "json"} onClick={() => setEditMode("json")}>
          {t("jsonMode", "JSON Editor")}
        </ModeBtn>
      </ModeRow>

      {editMode === "simple" ? (
        <>
          <Row>
            <Col style={{ gridColumn: "span 2" }}>
              <Label>{t("titleField", "Title")} ({lang})</Label>
              <Input value={getTLStrict(title, lang)} onChange={(e) => setTitle(setTL(title, lang, e.target.value))} />
            </Col>
            <Col style={{ gridColumn: "span 2" }}>
              <Label>{t("summary", "Summary")} ({lang})</Label>
              <TextArea rows={2} value={getTLStrict(summary, lang)} onChange={(e) => setSummary(setTL(summary, lang, e.target.value))} />
            </Col>
          </Row>
          <Row>
            <Col style={{ gridColumn: "span 4" }}>
              <Label>{t("content", "Content")} ({lang})</Label>
              <TextArea rows={8} value={getTLStrict(content, lang)} onChange={(e) => setContent(setTL(content, lang, e.target.value))} />
            </Col>
          </Row>
        </>
      ) : (
        <Row>
          <Col style={{ gridColumn: "span 4" }}>
            <JSONEditor
              label={t("multiLangJSON", "Title + Summary + Content (JSON)")}
              value={combinedJSONValue}
              onChange={onCombinedJSONChange}
              placeholder={placeholderObj}
            />
          </Col>
        </Row>
      )}

      {/* Görsel yükleme */}
      <BlockTitle>{t("images", "Images")}</BlockTitle>
      <ImageUploader
        existing={existingUploads}
        onExistingChange={setExistingUploads}
        removedExisting={removedExisting}
        onRemovedExistingChange={setRemovedExisting}
        files={newFiles}
        onFilesChange={setNewFiles}
        maxFiles={8}
        accept="image/*"
        sizeLimitMB={15}
        helpText={t("uploader.help", "jpg/png/webp • keeps order")}
      />

      <Row style={{ marginTop: 8 }}>
        <Col style={{ gridColumn: "span 2" }}>
          <Label>{t("tags", "Tags (comma separated)")}</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="news,announcement,..." />
        </Col>
        <Col>
          <Label>{t("isPublished", "Published?")}</Label>
          <CheckRow>
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            <span>{isPublished ? t("yes", "Yes") : t("no", "No")}</span>
          </CheckRow>
        </Col>
      </Row>

      <Actions>
        <Secondary type="button" onClick={onCancel}>{t("cancel", "Cancel")}</Secondary>
        <Primary type="submit">{isEdit ? t("update", "Update") : t("create", "Create")}</Primary>
      </Actions>
    </Form>
  );
}

/* ---- styled ---- */
const Form = styled.form`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;
const Row = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:${({theme})=>theme.spacings.md};
  ${({theme})=>theme.media.tablet}{grid-template-columns:repeat(2,1fr);}
  ${({theme})=>theme.media.mobile}{grid-template-columns:1fr;}
`;
const Col = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};min-width:0;`;
const BlockTitle = styled.h3`font-size:${({theme})=>theme.fontSizes.md};margin:${({theme})=>theme.spacings.sm} 0;`;
const Label = styled.label`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;
const Input = styled.input`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  min-width:0;
`;
const TextArea = styled.textarea`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const CheckRow = styled.label`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;`;
const FlexRow = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;`;
const Select = styled.select`
  flex:1 1 auto;
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const Small = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:8px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;
const ModeRow = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;margin-top:-6px;`;
const ModeBtn = styled.button<{ $active?: boolean }>`
  padding:8px 10px;border-radius:${({theme})=>theme.radii.pill};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  background:${({$active,theme})=>$active?theme.colors.primaryLight:theme.colors.cardBackground};
  color:${({theme})=>theme.colors.text};
  cursor:pointer;
`;
const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};justify-content:flex-end;`;
const Primary = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;
const Secondary = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;
