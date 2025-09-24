"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/newsletter/locales";
import { useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { subscribeNewsletter, clearNewsletterState } from "@/modules/newsletter/slice/newsletterSlice";
import { useRecaptcha } from "@/hooks/useRecaptcha";

export default function NewsletterModal({
  onClose,
  top = 120,
}: {
  open: boolean;
  onClose: () => void;
  top?: number | string;
}) {
  const { t } = useI18nNamespace("newsletter", translations);
  const dispatch = useAppDispatch();
  const execRecaptcha = useRecaptcha();

  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");             // honeypot
  const mountedAt = useRef<number>(Date.now()); // insan-zamanı ölçümü
  const [localError, setLocalError] = useState<string | null>(null);

  const { loading, error, successMessage } = useAppSelector((s) => s.newsletter);

  const offsetTop = typeof top === "number" ? `${top}px` : top;
  const canSubmit = useMemo(() => !!email && !loading, [email, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const tts = Date.now() - mountedAt.current;
    if (tts < 800) {
      setLocalError(t("human_check", "Lütfen güvenlik kontrolü için bir saniye bekleyip tekrar deneyin."));
      return;
    }

    const recaptchaToken = await execRecaptcha("newsletter_subscribe");
    if (!recaptchaToken) {
      setLocalError(t("captcha_failed", "reCAPTCHA doğrulaması başarısız oldu."));
      return;
    }

    const res: any = await dispatch(
      subscribeNewsletter({
        email: email.trim().toLowerCase(),
        recaptchaToken,
        hp,
        tts,
      })
    );

    if (res?.meta?.requestStatus === "fulfilled") {
      setTimeout(() => {
        dispatch(clearNewsletterState());
        onClose();
      }, 1400);
    }
  }

  const handleClose = () => {
    dispatch(clearNewsletterState());
    onClose();
  };

  return (
    <Overlay onClick={handleClose}>
      <Modal
        initial={{ x: 360, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 360, opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        $offsetTop={offsetTop}
        role="dialog"
        aria-modal="true"
        aria-label={t("modalTitle", "E-Bülten Aboneliği")}
      >
        <CloseButton onClick={handleClose} aria-label={t("admin.close", "Kapat")}>×</CloseButton>
        <ModalTitle>{t("modalTitle", "E-Bülten Aboneliği")}</ModalTitle>

        {successMessage ? (
          <SuccessMsg>{t("success", "Teşekkürler! E-bültenimize abone oldunuz.")}</SuccessMsg>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            {/* Honeypot */}
            <Honeypot aria-hidden="true">
              <label htmlFor="company" />
              <input
                id="company"
                name="company"
                autoComplete="off"
                tabIndex={-1}
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </Honeypot>

            <Input
              placeholder={t("form.email", "E-posta adresiniz")}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-label={t("form.email", "E-posta adresiniz")}
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
            />
            <SubmitBtn type="submit" disabled={!canSubmit}>
              {loading ? t("form.loading", "Gönderiliyor...") : t("form.subscribe", "Abone Ol")}
            </SubmitBtn>
            {(localError || error) && <ErrorMsg>{localError || error}</ErrorMsg>}
          </form>
        )}
      </Modal>
    </Overlay>
  );
}

/* ---------------- STYLES ---------------- */

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: ${({ theme }) => theme.colors.overlayBackground};
  z-index: ${({ theme }) => theme.zIndex.overlay};
`;

const Modal = styled(motion.div)<{ $offsetTop: string }>`
  width: 370px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.xl} 0 0 ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.lg} ${({ theme }) => theme.spacings.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex; flex-direction: column; min-height: 180px;
  font-family: ${({ theme }) => theme.fonts.main};
  position: fixed; right: 0; top: ${({ $offsetTop }) => $offsetTop}; margin: 0;

  ${({ theme }) => theme.media.small} {
    width: 100vw; right: 0; left: 0; top: 0; border-radius: 0;
    min-height: unset; padding: ${({ theme }) => theme.spacings.md} ${({ theme }) => theme.spacings.sm};
  }
`;

const Honeypot = styled.div`
  position: absolute !important;
  left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute; top: 12px; right: 18px; font-size: 2em;
  background: none; border: none; color: ${({ theme }) => theme.colors.textSecondary};
  opacity: .65; cursor: pointer; transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover { opacity: 1; }
`;

const ModalTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacings.md};
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  padding: .9em 1em;
  font-size: ${({ theme }) => theme.fontSizes.base};
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    outline: 0; box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
  }
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; opacity: 1; }
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: none; border-radius: ${({ theme }) => theme.radii.md};
  padding: .85em 1em; font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer; box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover,&:focus-visible { background: ${({ theme }) => theme.buttons.primary.backgroundHover}; outline: none; }
  &:disabled { background: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.textMuted}; cursor: not-allowed; opacity: ${({ theme }) => theme.opacity.disabled}; }
`;

const SuccessMsg = styled.div`
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.md};
  text-align: center; margin-top: ${({ theme }) => theme.spacings.xl};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const ErrorMsg = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.base};
  text-align: center; margin-top: ${({ theme }) => theme.spacings.md};
  font-family: ${({ theme }) => theme.fonts.body};
`;
