"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { SupportedLocale, SUPPORTED_LOCALES, LANG_LABELS } from "@/types/common";
import { Button } from "@/shared";
import type { ISectionMeta, ISectionSetting, TranslatedLabel } from "@/modules/section/types";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";

// Eksik locale'leri doldur
function fillAllLocales<T extends Partial<TranslatedLabel>>(input: T | undefined): TranslatedLabel {
  const result: TranslatedLabel = {} as any;
  for (const lng of SUPPORTED_LOCALES) {
    result[lng] = input?.[lng] ?? "";
  }
  return result;
}

type Props = {
  open: boolean;
  onClose: () => void;
  meta: ISectionMeta;
  setting?: ISectionSetting | null;
  onSave: (data: Partial<ISectionSetting>) => void | Promise<void>;
};

export default function SectionEditModal({
  open, onClose, meta, setting, onSave,
}: Props) {
  const { t } = useI18nNamespace("section", translations);

  const [activeLang, setActiveLang] = useState<SupportedLocale>("tr");
  const [label, setLabel] = useState<TranslatedLabel>(fillAllLocales(setting?.label || meta.label));
  const [description, setDescription] = useState<TranslatedLabel>(fillAllLocales(setting?.description || meta.description));
  const [enabled, setEnabled] = useState<boolean>(setting?.enabled ?? meta.defaultEnabled);
  const [order, setOrder] = useState<number>(setting?.order ?? meta.defaultOrder ?? 1);

  useEffect(() => {
    if (open) {
      setLabel(fillAllLocales(setting?.label || meta.label));
      setDescription(fillAllLocales(setting?.description || meta.description));
      setEnabled(setting?.enabled ?? meta.defaultEnabled);
      setOrder(setting?.order ?? meta.defaultOrder ?? 1);
      setActiveLang("tr");
    }
  }, [open, setting, meta]);

  if (!open) return null;

  const handleSave = () => onSave({ label, description, enabled, order });

  return (
    <Overlay role="dialog" aria-modal="true" aria-label={t("editSection", "Edit Section")}>
      <Dialog>
        <Header>
          <div>
            <Title>{t("editSection", "Edit Section")}</Title>
            <Sub>{meta.sectionKey}</Sub>
          </div>
          <CloseBtn onClick={onClose} aria-label={t("close", "Close")}>×</CloseBtn>
        </Header>

        <LangTabs>
          {SUPPORTED_LOCALES.map((lng) => (
            <LangBtn
              key={lng}
              className={activeLang === lng ? "active" : ""}
              onClick={() => setActiveLang(lng)}
              type="button"
              title={LANG_LABELS[lng]}
            >
              {LANG_LABELS[lng]}
            </LangBtn>
          ))}
        </LangTabs>

        <Body>
          <Field>
            <label>{t("label", "Label")}</label>
            <input
              value={label[activeLang] ?? ""}
              onChange={(e) => setLabel((l) => ({ ...l, [activeLang]: e.target.value }))}
              placeholder={`Label (${LANG_LABELS[activeLang]})`}
            />
          </Field>

          <Field>
            <label>{t("description", "Description")}</label>
            <textarea
              value={description[activeLang] ?? ""}
              onChange={(e) => setDescription((d) => ({ ...d, [activeLang]: e.target.value }))}
              placeholder={`Description (${LANG_LABELS[activeLang]})`}
              rows={3}
            />
          </Field>

          <Grid>
            <Field>
              <label>{t("enabled", "Enabled")}</label>
              <CheckRow>
                <input
                  id="enabled"
                  type="checkbox"
                  checked={!!enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span html-for="enabled">{enabled ? t("on", "On") : t("off", "Off")}</span>
              </CheckRow>
            </Field>

            <Field>
              <label>{t("order", "Order")}</label>
              <input
                type="number"
                value={order ?? 1}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={1}
                max={999}
              />
            </Field>
          </Grid>
        </Body>

        <Footer>
          <Button onClick={handleSave}>{t("save", "Save")}</Button>
          <Button variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
        </Footer>
      </Dialog>
    </Overlay>
  );
}

/* ---- styled (admin modal patern) ---- */
const Overlay = styled.div`
  position: fixed; inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  background: ${({ theme }) => theme.colors.overlayBackground};
  display:flex; align-items:center; justify-content:center;
  backdrop-filter: blur(1.2px);
`;
const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  width: 520px; max-width: 96vw;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacings.lg};
  display:flex; flex-direction:column; gap:${({ theme }) => theme.spacings.md};

  ${({ theme }) => theme.media.small} {
    width: 96vw; padding: ${({ theme }) => theme.spacings.md};
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;
const Header = styled.div`
  display:flex; align-items:center; justify-content:space-between;
`;
const Title = styled.h2`
  margin:0; color:${({ theme }) => theme.colors.title};
  font-size:${({ theme }) => theme.fontSizes.xl};
`;
const Sub = styled.div`
  color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.xsmall};
  margin-top:2px;
`;
const CloseBtn = styled.button`
  width: 34px; height: 34px; border-radius: ${({ theme }) => theme.radii.circle};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px; cursor: pointer; line-height: 1;
  &:hover { background: ${({ theme }) => theme.colors.hoverBackground}; }
`;
const LangTabs = styled.div`
  display:flex; flex-wrap:wrap; gap:${({ theme }) => theme.spacings.xs};
  margin-top: -${({ theme }) => theme.spacings.xs};
`;
const LangBtn = styled.button`
  padding: 6px 10px; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ theme }) => theme.colors.inputBackgroundLight};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  color:${({ theme }) => theme.colors.text}; cursor:pointer; font-size:${({ theme }) => theme.fontSizes.xsmall};
  &.active{
    background:${({ theme }) => theme.colors.primary}; color:${({ theme }) => theme.colors.buttonText};
    border-color:${({ theme }) => theme.colors.primary};
  }
`;
const Body = styled.div`
  display:flex; flex-direction:column; gap:${({ theme }) => theme.spacings.md};
`;
const Grid = styled.div`
  display:grid; grid-template-columns: 1fr 1fr; gap:${({ theme }) => theme.spacings.md};
  ${({ theme }) => theme.media.small} { grid-template-columns: 1fr; }
`;
const Field = styled.div`
  display:flex; flex-direction:column; gap: 0.35rem;
  label {
    font-size:${({ theme }) => theme.fontSizes.sm};
    font-weight:${({ theme }) => theme.fontWeights.medium};
    color:${({ theme }) => theme.colors.text};
  }
  input[type="checkbox"] {
    width: 18px; height: 18px; accent-color: ${({ theme }) => theme.colors.primary};
  }
  input:not([type="checkbox"]), textarea {
    border-radius:${({ theme }) => theme.radii.sm};
    border: 1.5px solid ${({ theme }) => theme.colors.inputBorder};
    padding:${({ theme }) => theme.spacings.sm};
    font-size:${({ theme }) => theme.fontSizes.sm};
    background:${({ theme }) => theme.colors.inputBackground};
    color:${({ theme }) => theme.colors.text};
    transition: border 0.18s;
    &:focus {
      border-color:${({ theme }) => theme.colors.inputBorderFocus};
      outline: 1.5px solid ${({ theme }) => theme.colors.inputOutline};
    }
  }
  textarea { min-height: 60px; resize: vertical; }
`;
const CheckRow = styled.div`
  display:flex; align-items:center; gap:${({ theme }) => theme.spacings.xs};
  span{ font-size:${({ theme }) => theme.fontSizes.xsmall}; color:${({ theme }) => theme.colors.textSecondary}; }
`;
const Footer = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm}; justify-content:flex-end; margin-top:${({ theme }) => theme.spacings.sm};
  button { min-width: 110px; }
  ${({ theme }) => theme.media.small} {
    flex-direction: column; gap: ${({ theme }) => theme.spacings.xs};
    button { width: 100%; }
  }
`;
