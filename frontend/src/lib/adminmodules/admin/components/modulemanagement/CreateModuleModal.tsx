"use client";

import React, { useState, ChangeEvent, FormEvent, useMemo } from "react";
import styled from "styled-components";
import { XCircle } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { createModuleMeta } from "@/modules/adminmodules/slices/moduleMetaSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { toast } from "react-toastify";
import { SUPPORTED_LOCALES } from "@/i18n";
import type { TranslatedLabel, SupportedLocale } from "@/types/common";

interface CreateModuleModalProps {
  onClose: () => void;
}

interface ModuleFormState {
  name: string;
  icon: string;
  roles: string;
  language: SupportedLocale;
  enabled: boolean;
  order: number;
}

const getLangLabel = (lang: string) => lang.toUpperCase();

const CreateModuleModal: React.FC<CreateModuleModalProps> = ({ onClose }) => {
  const { i18n, t } = useI18nNamespace("adminModules", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const dispatch = useAppDispatch();

  // Çoklu dil label objesi (tüm diller için key hazır)
  const [label, setLabel] = useState<TranslatedLabel>(
    SUPPORTED_LOCALES.reduce((acc, l) => ({ ...acc, [l]: "" }), {} as TranslatedLabel)
  );

  const [form, setForm] = useState<ModuleFormState>({
    name: "",
    icon: "MdSettings",
    roles: "admin",
    language: lang,
    enabled: true,
    order: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const atLeastOneLabel = useMemo(
    () => Object.values(label).some((v) => (v || "").trim().length > 0),
    [label]
  );
  const isValid = form.name.trim().length > 0 && atLeastOneLabel && !submitting;

  const handleLabelChange = (locale: string, value: string) => {
    setLabel((prev) => ({ ...prev, [locale]: value }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    if (type === "checkbox") newValue = (e.target as HTMLInputElement).checked;
    else if (type === "number") newValue = Math.max(0, parseInt(value || "0", 10) || 0);
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const getMsg = (msg: any) =>
    !msg ? "" : typeof msg === "string" ? msg : msg?.[lang] || msg?.en || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError(null);
    setSubmitting(true);
    try {
      await dispatch(
        createModuleMeta({
          name: form.name.trim(),
          icon: form.icon.trim(),
          language: form.language,
          enabled: !!form.enabled,
          order: Number.isFinite(form.order) ? form.order : 0,
          label: label as TranslatedLabel,
          roles: form.roles
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
        })
      ).unwrap();

      toast.success(t("success.created", "Module created successfully."));
      onClose();
    } catch (err: any) {
      setError(getMsg(err?.message) || t("errors.createFailed", "Module creation failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay>
      <Modal role="dialog" aria-modal="true" aria-labelledby="create-module-title">
        <Header>
          <ModalTitle id="create-module-title">{t("create", "Add New Module")}</ModalTitle>
          <CloseButton onClick={onClose} aria-label={t("close", "Close")} title={t("close", "Close")}>
            <XCircle size={20} />
          </CloseButton>
        </Header>

        {error && <ErrorText>{error}</ErrorText>}

        {/* Scrollable içerik */}
        <Content>
          <Form onSubmit={handleSubmit} autoComplete="off">
            <InputGroup>
              <label>{t("name", "Module Name")} *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                autoFocus
                required
                autoComplete="off"
                placeholder="e.g. blog, crm, analytics"
                disabled={submitting}
              />
            </InputGroup>

            {/* Çok dilli label alanları */}
            <LabelRow>
              {SUPPORTED_LOCALES.map((l) => (
                <LabelCol key={l}>
                  <label htmlFor={`label-${l}`}>{getLangLabel(l)}</label>
                  <input
                    id={`label-${l}`}
                    value={label[l]}
                    onChange={(e) => handleLabelChange(l, e.target.value)}
                    placeholder={t("labelPlaceholder", "Label in this language")}
                    autoComplete="off"
                    disabled={submitting}
                  />
                </LabelCol>
              ))}
            </LabelRow>

            <InputGroup>
              <label>{t("icon", "Icon")}</label>
              <input
                name="icon"
                value={form.icon}
                onChange={handleChange}
                autoComplete="off"
                placeholder="MdSettings, MdBook, MdLock ..."
                disabled={submitting}
              />
              <small style={{ color: "#888" }}>react-icons/md</small>
            </InputGroup>

            <InputGroup>
              <label>{t("roles", "Roles (comma separated)")}</label>
              <input
                name="roles"
                value={form.roles}
                onChange={handleChange}
                autoComplete="off"
                placeholder="admin, editor"
                disabled={submitting}
              />
            </InputGroup>

            <Row2>
              <InputGroup>
                <label>{t("language", "Language")}</label>
                <select name="language" value={form.language} onChange={handleChange} disabled={submitting}>
                  {SUPPORTED_LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {getLangLabel(l)}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup>
                <label>{t("order", "Order")}</label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  min={0}
                  autoComplete="off"
                  disabled={submitting}
                />
              </InputGroup>
            </Row2>

            <CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={!!form.enabled}
                  onChange={handleChange}
                  disabled={submitting}
                />
                {t("enabled", "Enabled")}
              </label>
            </CheckboxGroup>

            <Footer>
              <SubmitButton type="submit" disabled={!isValid} aria-busy={submitting}>
                {submitting ? t("saving", "Saving...") : t("createSubmit", "Create")}
              </SubmitButton>
            </Footer>
          </Form>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default CreateModuleModal;

/* --- styled --- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(3px);
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4vh 16px;
  overflow: auto;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacings.lg};
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacings.sm};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacings.xs};
  display: flex;
  align-items: center;
  transition: color ${({ theme }) => theme.transition.fast};
  &:hover { color: ${({ theme }) => theme.colors.danger}; }
`;

const Content = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.md};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xs};
  label { font-size: ${({ theme }) => theme.fontSizes.sm}; }
  input, select {
    padding: ${({ theme }) => theme.spacings.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
    border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.inputs.background};
    color: ${({ theme }) => theme.inputs.text};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacings.md};
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const LabelRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.sm};
  flex-wrap: wrap;
`;

const LabelCol = styled.div`
  flex: 1 1 140px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  input { width: 100%; }
`;

const CheckboxGroup = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.spacings.xs};
  label {
    display: flex; align-items: center; gap: ${({ theme }) => theme.spacings.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Footer = styled.div`
  margin-top: ${({ theme }) => theme.spacings.sm};
  flex: 0 0 auto;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.whiteColor};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.8; cursor: not-allowed; }
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0 0 ${({ theme }) => theme.spacings.sm};
`;
