"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  ChangeEvent,
  FormEvent,
} from "react";
import styled from "styled-components";
import { XCircle, AlertTriangle } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { useAppDispatch } from "@/store/hooks";
import { updateModuleSetting } from "@/modules/adminmodules/slices/moduleSettingSlice";
import type { IModuleSetting } from "@/modules/adminmodules/types";
import type { TranslatedLabel } from "@/types/common";
import { SUPPORTED_LOCALES } from "@/i18n";
import { toast } from "react-toastify";

// --- Props ---
interface EditTenantModuleModalProps {
  module: IModuleSetting & { name?: string }; // bazı kartlarda name gelebilir
  onClose: () => void;
  onAfterAction?: () => void;
  globalEnabled?: boolean; // ilgili meta globalde kapalı mı?
}

interface FormState {
  enabled: boolean;
  visibleInSidebar: boolean;
  useAnalytics: boolean;
  showInDashboard: boolean;
  roles: string; // comma separated
  order: number;
  seoTitle: TranslatedLabel;
  seoDescription: TranslatedLabel;
  seoSummary: TranslatedLabel;
  seoOgImage: string;
}

const EditTenantModuleModal: React.FC<EditTenantModuleModalProps> = ({
  module,
  onClose,
  onAfterAction,
  globalEnabled = true,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useI18nNamespace("adminModules", translations);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setting + Meta birleşimi (setting öncelik; boş dilleri meta’dan tamamla)
  const mergeML = (
    setting?: TranslatedLabel
  ): TranslatedLabel =>
    SUPPORTED_LOCALES.reduce((acc, lng) => {
      const s = (setting?.[lng] ?? "").trim();
      return { ...acc, [lng]: s || "" };
    }, {} as TranslatedLabel);

  // Başlangıç formu: setting değerleri + boşlar meta’dan
  const initialForm = useMemo<FormState>(() => {
    return {
      enabled: !!module.enabled,
      visibleInSidebar: !!module.visibleInSidebar,
      useAnalytics: !!module.useAnalytics,
      showInDashboard: !!module.showInDashboard,
      roles: Array.isArray(module.roles) ? module.roles.join(", ") : "",
      order: Number.isFinite(module.order) ? Number(module.order) : 0,
      seoTitle: mergeML(module.seoTitle),
      seoDescription: mergeML(module.seoDescription),
      seoSummary: mergeML(module.seoSummary),
      seoOgImage: module.seoOgImage || "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    module.enabled,
    module.visibleInSidebar,
    module.useAnalytics,
    module.showInDashboard,
    module.roles,
    module.order,
    module.seoTitle,
    module.seoDescription,
    module.seoSummary,
    module.seoOgImage,
    module.module,
    module.name,
  ]);

  const [form, setForm] = useState<FormState>(initialForm);

  // module/meta değiştiğinde formu yeniden kur
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number.isNaN(parseInt(value, 10))
            ? 0
            : Math.max(0, parseInt(value, 10))
          : value,
    }));
  };

  const handleSeoChange = (
    field: "seoTitle" | "seoDescription" | "seoSummary",
    lng: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lng]: value },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const rolesArray = Array.from(
        new Set(
          (form.roles || "")
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
        )
      );

      const payload: Partial<IModuleSetting> & { module: string } = {
        module: module.module || (module.name as string),
        enabled: form.enabled,
        visibleInSidebar: form.visibleInSidebar,
        useAnalytics: form.useAnalytics,
        showInDashboard: form.showInDashboard,
        roles: rolesArray,
        order: form.order,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoSummary: form.seoSummary,
        seoOgImage: form.seoOgImage,
      };

      await dispatch(updateModuleSetting(payload)).unwrap();

      onAfterAction?.();
      onClose();
    } catch (err: any) {
      toast.error(
        t("updateError", "Update failed.") +
          (err?.message ? `: ${err.message}` : "")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formDisabled = !globalEnabled;

  return (
    <Overlay>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tenant-module-title"
      >
        <Header>
          <Title id="edit-tenant-module-title">
            {t("editTitle", "Edit Tenant Setting")}
          </Title>
          <CloseButton
            onClick={onClose}
            aria-label={t("close", "Close")}
            title={t("close", "Close")}
          >
            <XCircle size={22} />
          </CloseButton>
        </Header>

        {!globalEnabled && (
          <WarnBox role="alert">
            <AlertTriangle size={17} style={{ marginRight: 6 }} />
            {t(
              "globalDisabledWarn",
              "This module is globally disabled. Tenant settings are ignored."
            )}
          </WarnBox>
        )}

        {/* Scrollable content */}
        <Content>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* General overrides */}
            <InputGroup>
              <label>{t("roles", "Roles (comma separated)")}</label>
              <input
                name="roles"
                value={form.roles}
                onChange={handleChange}
                placeholder="admin, editor"
                autoComplete="off"
                disabled={formDisabled || isSubmitting}
              />
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
                disabled={formDisabled || isSubmitting}
              />
            </InputGroup>

            <CheckboxGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={!!form.enabled}
                  onChange={handleChange}
                  disabled={formDisabled || isSubmitting}
                />
                <span>{t("enabled", "Enabled")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="visibleInSidebar"
                  checked={!!form.visibleInSidebar}
                  onChange={handleChange}
                  disabled={formDisabled || isSubmitting}
                />
                <span>{t("visibleInSidebar", "Show in Sidebar")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="useAnalytics"
                  checked={!!form.useAnalytics}
                  onChange={handleChange}
                  disabled={formDisabled || isSubmitting}
                />
                <span>{t("useAnalytics", "Enable Analytics")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="showInDashboard"
                  checked={!!form.showInDashboard}
                  onChange={handleChange}
                  disabled={formDisabled || isSubmitting}
                />
                <span>{t("showInDashboard", "Show on Dashboard")}</span>
              </CheckboxLabel>
            </CheckboxGroup>

            {/* SEO overrides */}
            <SectionTitle>{t("seoOverrides", "SEO Overrides")}</SectionTitle>

            <InputGroup>
              <label>{t("seoOgImage", "OG Image URL")}</label>
              <input
                name="seoOgImage"
                value={form.seoOgImage}
                onChange={handleChange}
                placeholder="https://..."
                autoComplete="off"
                disabled={formDisabled || isSubmitting}
              />
            </InputGroup>

            {SUPPORTED_LOCALES.map((lng) => (
              <SeoRow key={lng}>
                <LangBadge title={lng.toUpperCase()}>
                  {lng.toUpperCase()}
                </LangBadge>
                <div>
                  <SmallLabel>{t("seoTitle", "SEO Title")}</SmallLabel>
                  <input
                    value={form.seoTitle[lng]}
                    onChange={(e) =>
                      handleSeoChange("seoTitle", lng, e.target.value)
                    }
                    placeholder={t(
                      "seoTitlePlaceholder",
                      "Title for search & social"
                    )}
                    autoComplete="off"
                    disabled={formDisabled || isSubmitting}
                  />
                </div>
                <div>
                  <SmallLabel>
                    {t("seoDescription", "SEO Description")}
                  </SmallLabel>
                  <Textarea
                    value={form.seoDescription[lng]}
                    onChange={(e) =>
                      handleSeoChange(
                        "seoDescription",
                        lng,
                        e.target.value
                      )
                    }
                    placeholder={t("seoDescPlaceholder", "Short description")}
                    autoComplete="off"
                    disabled={formDisabled || isSubmitting}
                    rows={2}
                  />
                </div>
                <div>
                  <SmallLabel>{t("seoSummary", "SEO Summary")}</SmallLabel>
                  <Textarea
                    value={form.seoSummary[lng]}
                    onChange={(e) =>
                      handleSeoChange("seoSummary", lng, e.target.value)
                    }
                    placeholder={t(
                      "seoSummaryPlaceholder",
                      "Extended summary"
                    )}
                    autoComplete="off"
                    disabled={formDisabled || isSubmitting}
                    rows={2}
                  />
                </div>
              </SeoRow>
            ))}

            <Footer>
              <SubmitButton
                type="submit"
                disabled={isSubmitting || formDisabled}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? t("saving", "Saving...") : t("save", "Save")}
              </SubmitButton>
            </Footer>
          </form>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default EditTenantModuleModal;

/* --- styled --- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4vh 16px;
  overflow: auto;
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacings.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 100%;
  max-width: 720px;
  max-height: 92vh;
  box-shadow: ${({ theme }) => theme.shadows.lg};
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

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const WarnBox = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.warning};
  color: #fff;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 7px 11px;
  margin-bottom: ${({ theme }) => theme.spacings.sm};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color ${({ theme }) => theme.transition.fast};
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Content = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
`;

const Footer = styled.div`
  margin-top: ${({ theme }) => theme.spacings.md};
  flex: 0 0 auto;
`;

const InputGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xs};
  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
  input,
  select,
  textarea {
    padding: ${({ theme }) => theme.spacings.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
    border: ${({ theme }) => theme.borders.thin}
      ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.fontSizes.md};
    background: ${({ theme }) => theme.inputs.background};
    color: ${({ theme }) => theme.inputs.text};
  }
`;

const CheckboxGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacings.sm};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: ${({ theme }) => theme.spacings.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SectionTitle = styled.h4`
  margin: ${({ theme }) => theme.spacings.md} 0
    ${({ theme }) => theme.spacings.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
`;

const SeoRow = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: ${({ theme }) => theme.spacings.sm};
  align-items: start;
  padding: ${({ theme }) => theme.spacings.sm} 0;
  border-top: ${({ theme }) => theme.borders.thin}
    ${({ theme }) => theme.colors.border};
  &:first-of-type {
    border-top: none;
  }
  > div {
    grid-column: 2 / -1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const LangBadge = styled.div`
  grid-column: 1 / 2;
  align-self: center;
  justify-self: center;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const SmallLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.9;
`;

const Textarea = styled.textarea`
  resize: vertical;
  min-height: 64px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacings.sm};
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
  }
  &:disabled {
    opacity: 0.85;
    cursor: not-allowed;
  }
`;
