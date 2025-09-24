"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/team/locales";
import type { ITeam } from "@/modules/team/types";
import { JSONEditor, ImageUploader } from "@/shared";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import { toast } from "react-toastify";

/* ---------------- helpers (ActivityForm pattern) ---------------- */

type TL = Partial<Record<SupportedLocale, string>>;
type UploadImage = { url: string; thumbnail?: string; webp?: string; publicId?: string };

const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(two as SupportedLocale)
    ? (two as SupportedLocale)
    : ("tr" as SupportedLocale);
};

const setTL = (obj: TL | undefined, l: SupportedLocale, val: string): TL => ({
  ...(obj || {}),
  [l]: val,
});

const getTLStrict = (obj?: TL, l?: SupportedLocale) => (l ? (obj?.[l] ?? "") : "");

const toTL = (v: any, lang: SupportedLocale): TL =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as TL) : v ? ({ [lang]: String(v) } as TL) : {};

/* ---------------- props ---------------- */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingItem: ITeam | null;
  onSubmit: (formData: FormData, id?: string) => Promise<void>;
}

/* ---------------- component ---------------- */

export default function TeamForm({
  isOpen,
  onClose,
  editingItem,
  onSubmit,
}: Props) {
  const { t, i18n } = useI18nNamespace("team", translations);
  const lang = useMemo<SupportedLocale>(() => getUILang(i18n?.language), [i18n?.language]);

  // --- GLOBAL STATE ---
  const successMessage = useAppSelector((state) => state.team.successMessage);
  const error = useAppSelector((state) => state.team.error);
  const currentUser = useAppSelector((state) => state.account.profile);
  const loading = useAppSelector((state) => state.team.loading);

  const isEdit = Boolean(editingItem?._id);

  // --- LOCAL STATE (Activity pattern) ---
  const [editMode, setEditMode] = useState<"simple" | "json">("simple");

  const [title, setTitle] = useState<TL>((editingItem?.title as TL) || {});
  const [summary, setSummary] = useState<TL>((editingItem?.summary as TL) || {});
  const [content, setContent] = useState<TL>((editingItem?.content as TL) || {});

  const [author, setAuthor] = useState<string>(editingItem?.author || (currentUser as any)?.name || "");
  const [tags, setTags] = useState<string>(
    Array.isArray(editingItem?.tags) ? editingItem!.tags.join(", ") : ""
  );
  const [category, setCategory] = useState<string>(
    typeof editingItem?.category === "string" ? editingItem.category : ""
  );

  // --- images (hook DEĞİL; koşullu çağrı şüphesi yok)
 const originalExisting = useMemo(
    () => (Array.isArray(editingItem?.images) ? editingItem!.images : []),
    [editingItem]
  );

  const [existingUploads, setExistingUploads] = useState<UploadImage[]>(() =>
    originalExisting.map((img) => ({
      url: img.url,
      thumbnail: img.thumbnail,
      webp: img.webp,
      publicId: img.publicId,
    }))
  );
  const [removedExisting, setRemovedExisting] = useState<UploadImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // editingItem değişince görsel durumlarını yenile
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

    // Düzenlenen kayıt değiştiyse text alanlarını da güncelle (edit → edit geçişleri)
    setTitle((editingItem?.title as TL) || {});
    setSummary((editingItem?.summary as TL) || {});
    setContent((editingItem?.content as TL) || {});
    setAuthor(editingItem?.author || (currentUser as any)?.name || "");
    setTags(Array.isArray(editingItem?.tags) ? editingItem!.tags.join(", ") : "");
    setCategory(typeof editingItem?.category === "string" ? editingItem.category : "");
  }, [editingItem, currentUser, originalExisting]); // ← eksik dependency uyarısı çözülür

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

  // --- toast reaction ---
  useEffect(() => {
    if (!isOpen) return;
    if (successMessage) {
      toast.success(successMessage);
      onClose();
    } else if (error) {
      toast.error(error);
    }
  }, [successMessage, error, isOpen, onClose]);

  // --- JSON Editor birleşik değer ---
  const combinedJSONValue = useMemo(() => ({ title, summary, content }), [title, summary, content]);
  const onCombinedJSONChange = (v: any) => {
    setTitle(toTL(v?.title, lang));
    setSummary(toTL(v?.summary, lang));
    setContent(toTL(v?.content, lang));
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Minimal validasyon: en az bir dilde başlık
    const hasAnyTitle = (SUPPORTED_LOCALES as SupportedLocale[]).some(
      (l) => (title?.[l] || "").trim().length > 0
    );
    if (!hasAnyTitle) {
      toast.warn(t("admin.team.validation.title", "En az bir dilde başlık girmelisiniz."));
      return;
    }

    const fd = new FormData();

    // TL alanlar
    fd.append("title", JSON.stringify(title || {}));
    fd.append("summary", JSON.stringify(summary || {}));
    fd.append("content", JSON.stringify(content || {}));

    // Diğer alanlar
    fd.append("author", (author || "").trim());

    const tagList = (tags || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    fd.append("tags", JSON.stringify(tagList));

    if (category.trim()) fd.append("category", category.trim());

    // create akışında default yayınla (eski davranışa uyum)
    if (!isEdit) fd.append("isPublished", "true");

    // Yeni görseller
    newFiles.forEach((f) => fd.append("images", f));

    // Kaldırılan mevcutlar → hem id hem publicId/url ile bildir
    const removeIds: string[] = [];
    removedExisting.forEach((img) => {
      const id =
        (img.publicId && idBySig.get(`pid:${img.publicId}`)) ||
        (img.url && idBySig.get(`url:${img.url}`));
      if (id) removeIds.push(id);
    });
    removeIds.forEach((id) => fd.append("removeImageIds[]", id));

    if (removedExisting.length) {
      fd.append(
        "removedImages",
        JSON.stringify(removedExisting.map((x) => ({ publicId: x.publicId, url: x.url })))
      );
    }

    // Mevcut görsellerin yeni sırası (publicId/url imzası)
    if (existingUploads.length) {
      const orderSig = existingUploads.map((x) => x.publicId || x.url).filter(Boolean) as string[];
      fd.append("existingImagesOrder", JSON.stringify(orderSig));
    }

    if (isEdit && editingItem?._id) await onSubmit(fd, editingItem._id);
    else await onSubmit(fd);
  };

  // JSON placeholder (boş şablon) — sabit
  const placeholderObj = useMemo(() => {
    const langs = SUPPORTED_LOCALES as SupportedLocale[];
    const empty = Object.fromEntries(langs.map((l) => [l, ""])) as TL;
    return JSON.stringify({ title: empty, summary: empty, content: empty }, null, 2);
  }, []); // sabit; bağımlılık yok

  return isOpen ? (
    <FormCard role="form" aria-label={isEdit ? "Edit Team" : "Create Team"}>
      <Header>
        <h2>
          {isEdit
            ? t("admin.team.edit", "Edit Team")
            : t("admin.team.create", "Create New Team")}
        </h2>
      </Header>

      {/* Düzen Modu */}
      <ModeRow role="radiogroup" aria-label={t("editMode", "Edit Mode")}>
        <ModeBtn
          type="button"
          aria-pressed={editMode === "simple"}
          $active={editMode === "simple"}
          onClick={() => setEditMode("simple")}
        >
          {t("simpleMode", "Basit")}
        </ModeBtn>
        <ModeBtn
          type="button"
          aria-pressed={editMode === "json"}
          $active={editMode === "json"}
          onClick={() => setEditMode("json")}
        >
          {t("jsonMode", "JSON Editor")}
        </ModeBtn>
      </ModeRow>

      <form onSubmit={handleSubmit}>
        {editMode === "simple" ? (
          <>
            <Row>
              <Col style={{ gridColumn: "span 2" }}>
                <Label>
                  {t("admin.team.title", "Title")} ({lang.toUpperCase()})
                </Label>
                <Input
                  value={getTLStrict(title, lang)}
                  onChange={(e) => setTitle(setTL(title, lang, e.target.value))}
                  placeholder={t("admin.team.title_ph", "Enter title")}
                />
              </Col>
              <Col style={{ gridColumn: "span 2" }}>
                <Label>
                  {t("admin.team.summary", "Summary")} ({lang.toUpperCase()})
                </Label>
                <TextArea
                  rows={2}
                  value={getTLStrict(summary, lang)}
                  onChange={(e) => setSummary(setTL(summary, lang, e.target.value))}
                  placeholder={t("admin.team.summary_ph", "Short summary")}
                />
              </Col>
            </Row>

            <Row>
              <Col style={{ gridColumn: "span 4" }}>
                <Label>
                  {t("admin.team.content", "Content")} ({lang.toUpperCase()})
                </Label>
                <TextArea
                  rows={8}
                  value={getTLStrict(content, lang)}
                  onChange={(e) => setContent(setTL(content, lang, e.target.value))}
                  placeholder={t("admin.team.content_ph", "Main content")}
                />
              </Col>
            </Row>
          </>
        ) : (
          <Row>
            <Col style={{ gridColumn: "span 4" }}>
              <JSONEditor
                label={t("admin.team.multiLangJSON", "Title + Summary + Content (JSON)")}
                value={combinedJSONValue}
                onChange={onCombinedJSONChange}
                placeholder={placeholderObj}
              />
            </Col>
          </Row>
        )}

        {/* Diğer alanlar */}
        <Row>
          <Col style={{ gridColumn: "span 2" }}>
            <Label htmlFor="author">{t("admin.team.author", "Author")}</Label>
            <Input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </Col>

          <Col style={{ gridColumn: "span 2" }}>
            <Label htmlFor="category">{t("admin.team.category", "Category")}</Label>
            <Input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t("admin.team.category_placeholder", "Type a category (optional)")}
            />
          </Col>
        </Row>

        <Row>
          <Col style={{ gridColumn: "span 4" }}>
            <Label htmlFor="tags">{t("admin.team.tags", "Tags")}</Label>
            <Input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </Col>
        </Row>

        {/* Görseller */}
        <BlockTitle>{t("admin.team.image", "Images")}</BlockTitle>
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

        <Actions>
          <Secondary type="button" onClick={onClose} disabled={loading}>
            {t("admin.cancel", "Cancel")}
          </Secondary>
          <Primary type="submit" disabled={loading}>
            {isEdit ? t("admin.update", "Update") : t("admin.create", "Create")}
          </Primary>
        </Actions>
      </form>
    </FormCard>
  ) : null;
}

/* ---------------- styled (classicTheme) ---------------- */

const FormCard = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.lg};
  background: ${({ theme }) => theme.cards.background};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.form};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.md};
  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.title};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-family: ${({ theme }) => theme.fonts.heading};
  }
`;

const ModeRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.xs};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacings.sm};
`;

const ModeBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) => ($active ? theme.colors.primaryLight : theme.colors.cardBackground)};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacings.md};
  ${({ theme }) => theme.media.tablet} { grid-template-columns: repeat(2, 1fr); }
  ${({ theme }) => theme.media.mobile} { grid-template-columns: 1fr; }
`;

const Col = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.spacings.xs}; min-width: 0;
`;

const BlockTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin: ${({ theme }) => theme.spacings.sm} 0;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  min-width: 0;
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  min-height: 110px;
  resize: vertical;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacings.md};
`;

const Primary = styled.button`
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.buttons.primary.backgroundHover};
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
`;

const Secondary = styled.button`
  background: ${({ theme }) => theme.buttons.secondary.background};
  color: ${({ theme }) => theme.buttons.secondary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
`;
