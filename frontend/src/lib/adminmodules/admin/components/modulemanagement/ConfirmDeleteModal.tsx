"use client";

import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { XCircle } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

// --- Props ---
interface ConfirmDeleteModalProps {
  moduleName?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * ConfirmDeleteModal
 * Sadece global meta modülünü silmek için kullanılmalı.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  moduleName,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  const { t } = useI18nNamespace("adminModules", translations);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const descId = "delete-module-desc";
  const titleId = "delete-module-title";

  // Body scroll kilidi
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC / Enter ve ilk focus
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (
        (e.key === "Enter" || e.key === " ") &&
        document.activeElement === confirmRef.current
      ) {
        e.preventDefault();
        if (!loading) onConfirm();
      }
      // Focus trap (Tab/Shift+Tab)
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
    // İlk odak
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel, onConfirm, loading]);

  // Backdrop click ile kapat
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <Overlay onClick={onBackdropClick} data-testid="confirm-delete-overlay">
      <Modal
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        data-testid="confirm-delete-modal"
      >
        <Header>
          <Title id={titleId}>{t("deleteTitle", "Delete Module")}</Title>
          <CloseButton
            onClick={onCancel}
            aria-label={t("close", "Close")}
            title={t("close", "Close")}
            type="button"
          >
            <XCircle size={22} />
          </CloseButton>
        </Header>

        <Content>
          <WarningText id={descId}>
            {t(
              "deleteWarning",
              "Are you sure you want to permanently delete this module?"
            )}
          </WarningText>
          <ModuleName>
            {moduleName || t("moduleUnknown", "Module name unknown")}
          </ModuleName>
        </Content>

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={onCancel}
            tabIndex={0}
            aria-label={t("cancel", "Cancel")}
            title={t("cancel", "Cancel")}
            disabled={loading}
          >
            {t("cancel", "Cancel")}
          </CancelButton>
          <ConfirmButton
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            tabIndex={0}
            aria-label={t("confirmDelete", "Delete Permanently")}
            title={t("confirmDelete", "Delete Permanently")}
            disabled={loading}
            aria-busy={loading}
          >
            {loading
              ? t("deleting", "Deleting...")
              : t("confirmDelete", "Delete Permanently")}
          </ConfirmButton>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default ConfirmDeleteModal;

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
  max-width: 420px;
  width: 95%;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  outline: none;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacings.xs};
  transition: color ${({ theme }) => theme.transition.fast};
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Content = styled.div`
  margin-top: ${({ theme }) => theme.spacings.lg};
  text-align: center;
`;

const WarningText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
`;

const ModuleName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.primary};
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacings.lg};
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const CancelButton = styled.button`
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBackground};
    color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.whiteColor};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
