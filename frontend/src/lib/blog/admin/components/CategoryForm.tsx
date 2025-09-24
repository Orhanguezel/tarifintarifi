"use client";
import styled from "styled-components";
import { useMemo, useState, useEffect } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/blog/locales";
import type { BlogCategory } from "@/modules/blog/types";
import type { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES } from "@/types/common";

type TL = Partial<Record<SupportedLocale, string>>;
const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0,2).toLowerCase();
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(two) ? (two as SupportedLocale) : "tr";
};
const setTL = (obj: TL | undefined, l: SupportedLocale, val: string): TL => ({ ...(obj||{}), [l]: val });
const getTLStrict = (obj?: TL, l?: SupportedLocale)=> (l ? (obj?.[l] ?? "") : "");

type Props = {
  isOpen: boolean;
  editingItem: BlogCategory | null;
  onClose: () => void;
  onSubmit: (data: { name: Record<SupportedLocale,string>, description?: Record<SupportedLocale,string> }, id?: string) => Promise<void> | void;
};

export default function CategoryForm({ isOpen, editingItem, onClose, onSubmit }: Props) {
  const { t, i18n } = useI18nNamespace("blog", translations);
  const lang = useMemo<SupportedLocale>(()=>getUILang(i18n?.language), [i18n?.language]);

  const [name, setName] = useState<TL>({});
  const [description, setDescription] = useState<TL>({});
  const isEdit = Boolean(editingItem?._id);

  useEffect(()=>{
    setName((editingItem?.name as TL) || {});
    setDescription((editingItem?.description as TL) || {});
  }, [editingItem]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: name as Record<SupportedLocale,string>, description: description as Record<SupportedLocale,string> };
    if (isEdit && editingItem?._id) await onSubmit(payload, editingItem._id);
    else await onSubmit(payload);
    onClose();
  };

  return (
    <Form onSubmit={submit}>
      <Row>
        <Col>
          <Label>{t("category_name","Category Name")} ({lang})</Label>
          <Input value={getTLStrict(name, lang)} onChange={(e)=>setName(setTL(name, lang, e.target.value))} />
        </Col>
        <Col>
          <Label>{t("category_desc","Description")} ({lang})</Label>
          <TextArea rows={2} value={getTLStrict(description, lang)} onChange={(e)=>setDescription(setTL(description, lang, e.target.value))} />
        </Col>
      </Row>
      <Actions>
        <Secondary type="button" onClick={onClose}>{t("cancel","Cancel")}</Secondary>
        <Primary type="submit">{isEdit? t("update","Update") : t("create","Create")}</Primary>
      </Actions>
    </Form>
  );
}

/* styled */
const Form = styled.form`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};min-width:320px;`;
const Row = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:${({theme})=>theme.spacings.md};`;
const Col = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};`;
const Label = styled.label`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;
const Input = styled.input`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const TextArea = styled.textarea`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
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
