"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import styled from "styled-components";
import { XCircle } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { useAppDispatch } from "@/store/hooks";
import { updateModuleMeta } from "@/modules/adminmodules/slices/moduleMetaSlice";
import { SUPPORTED_LOCALES } from "@/i18n";
import type { IModuleMeta } from "@/modules/adminmodules/types";
import type { TranslatedLabel } from "@/types/common";
import { toast } from "react-toastify";

// --- Props ---
interface EditGlobalModuleModalProps {
  module: IModuleMeta;
  onClose: () => void;
  onAfterAction?: () => void;
}

interface FormState {
  label: TranslatedLabel;
  icon: string;
  roles: string; // comma separated input
  enabled: boolean;
  order: number;
}

const EditGlobalModuleModal: React.FC<EditGlobalModuleModalProps> = ({
  module,
  onClose,
  onAfterAction,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useI18nNamespace("adminModules", translations);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    label: SUPPORTED_LOCALES.reduce(
      (acc, l) => ({ ...acc, [l]: module.label?.[l] ?? "" }),
      {} as TranslatedLabel
    ),
    icon: module.icon || "box",
    roles: Array.isArray(module.roles) ? module.roles.join(", ") : "",
    enabled: !!module.enabled,
    order: typeof module.order === "number" ? module.order : 0,
  }));

  // Accessibility refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const titleId = "edit-module-title";
  const descId = "edit-module-desc";

  // sync when module prop changes
  useEffect(() => {
    setForm({
      label: SUPPORTED_LOCALES.reduce(
        (acc, l) => ({ ...acc, [l]: module.label?.[l] ?? "" }),
        {} as TranslatedLabel
      ),
      icon: module.icon || "box",
      roles: Array.isArray(module.roles) ? module.roles.join(", ") : "",
      enabled: !!module.enabled,
      order: typeof module.order === "number" ? module.order : 0,
    });
  }, [module]);

  // Body scroll lock + focus trap + Esc / Enter behavior
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // initial focus
    firstFocusRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      // focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Backdrop close
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // i18n labels
  const handleLabelChange = (l: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      label: { ...prev.label, [l]: value },
    }));
  };

  // generic changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      const parsed = parseInt(value, 10);
      newValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  // submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // roles -> array (trim + dedup + filter)
      const rolesArray = Array.from(
        new Set(
          form.roles
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
        )
      );

      // allowed fields (controller zaten filtreliyor)
      const metaUpdate: Partial<IModuleMeta> = {
        label: form.label,
        icon: form.icon,
        roles: rolesArray,
        enabled: form.enabled,
        order: form.order,
      };

      await dispatch(
        updateModuleMeta({ name: module.name, updates: metaUpdate })
      ).unwrap();

      onAfterAction?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.message ||
        t("updateError", "Update failed.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Overlay onClick={onBackdropClick}>
      <Modal
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <Title id={titleId}>{t("editTitle", "Edit Module")}</Title>
          <CloseButton
            type="button"
            onClick={onClose}
            aria-label={t("close", "Close")}
            title={t("close", "Close")}
            ref={firstFocusRef}
          >
            <XCircle size={22} />
          </CloseButton>
        </Header>

        <Description id={descId}>
          {t("editDesc", "Update module meta for this tenant.")}
        </Description>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Çoklu dil label alanları */}
          {SUPPORTED_LOCALES.map((l) => (
            <InputGroup key={l}>
              <label htmlFor={`label-${l}`}>{l.toUpperCase()}</label>
              <input
                id={`label-${l}`}
                value={form.label[l]}
                onChange={(e) => handleLabelChange(l, e.target.value)}
                placeholder={t(
                  `labelPlaceholder.${l}`,
                  "Module name in this language"
                )}
                autoComplete="off"
                disabled={isSubmitting}
              />
            </InputGroup>
          ))}

          <InputGroup>
            <label htmlFor="icon">{t("icon", "Icon")}</label>
            <input
              id="icon"
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder={t("iconPlaceholder", "Icon")}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="roles">{t("roles", "Roles (comma separated)")}</label>
            <input
              id="roles"
              name="roles"
              value={form.roles}
              onChange={handleChange}
              placeholder="admin, editor"
              autoComplete="off"
              disabled={isSubmitting}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="order">{t("order", "Order")}</label>
            <input
              id="order"
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              min={0}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </InputGroup>

          <CheckboxGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="enabled"
                checked={!!form.enabled}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span>{t("enabled", "Enabled")}</span>
            </CheckboxLabel>
            {!form.enabled && (
              <WarnText>
                {t(
                  "tenantDisabledWarn",
                  "Disabling here will hide this module for this tenant; tenant overrides will be ignored."
                )}
              </WarnText>
            )}
          </CheckboxGroup>

          <SubmitButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? t("saving", "Saving...") : t("save", "Save")}
          </SubmitButton>
        </form>
      </Modal>
    </Overlay>
  );
};

export default EditGlobalModuleModal;

/* --- styled --- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacings.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 95%;
  max-width: 520px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  outline: none;
`;

const Header = styled.div`
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

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacings.xs};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: color ${({ theme }) => theme.transition.fast};
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Description = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacings.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const InputGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xs};
  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
  }
  input,
  select {
    padding: ${({ theme }) => theme.spacings.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
    border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.fontSizes.md};
    background: ${({ theme }) => theme.inputs.background};
    color: ${({ theme }) => theme.inputs.text};
  }
`;

const CheckboxGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
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

const WarnText = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
  margin-top: 4px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacings.sm};
  margin-top: ${({ theme }) => theme.spacings.md};
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
