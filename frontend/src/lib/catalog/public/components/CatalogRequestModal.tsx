"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/catalog/locales";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendCatalogRequest, clearCatalogState } from "@/modules/catalog/slice/catalogSlice";
import { SUPPORTED_LOCALES } from "@/types/common";
import { toast } from "react-toastify";

export default function CatalogRequestModal({
  onClose,
  top = 120, // üst boşluk (px veya "3rem")
}: {
  onClose: () => void;
  top?: number | string;
}) {
  const { t, i18n } = useI18nNamespace("catalogRequest", translations);
  const dispatch = useAppDispatch();
  const { loading, successMessage } = useAppSelector((s) => s.catalog);

  const locale =
    (i18n.language?.slice(0, 2) as typeof SUPPORTED_LOCALES[number]) || "tr";

  const KATALOG_URL =
    "https://res.cloudinary.com/dbozv7wqd/raw/upload/v1753910122/uploads/ensotek/library/ensotekcatalog-1753910118660-672914705";
  const KATALOG_FILE_NAME = "ensotek.catalog.pdf";

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: t("form.subjectDefault", "Katalog Talebi"),
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await dispatch(
      sendCatalogRequest({
        ...form,
        locale,
        catalogFileUrl: KATALOG_URL,
        catalogFileName: KATALOG_FILE_NAME,
      })
    )
      .unwrap()
      .then(() => {
        setTimeout(() => {
          dispatch(clearCatalogState());
          onClose();
        }, 1700);
      })
      .catch((err: any) => {
        if (err?.errors?.length) {
          err.errors.forEach((errorObj: any) => {
            toast.error(errorObj.msg || errorObj.message || "Bir hata oluştu!");
          });
        } else if (err?.message) {
          toast.error(err.message);
        } else {
          toast.error(t("error.unknown", "Bilinmeyen bir hata oluştu!"));
        }
      });
  }

  function handleClose() {
    setForm({
      name: "",
      email: "",
      company: "",
      phone: "",
      subject: t("form.subjectDefault", "Katalog Talebi"),
      message: "",
    });
    dispatch(clearCatalogState());
    onClose();
  }

  const offsetTop = typeof top === "number" ? `${top}px` : top;

  return (
    <Overlay onClick={handleClose}>
      <Modal
        initial={{ x: 360, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 360, opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        $offsetTop={offsetTop}               // <-- transient prop (DOM’a sızmaz)
        role="dialog"
        aria-modal="true"
        aria-label={t("modalTitle", "Katalog Talep Formu")}
      >
        <CloseButton onClick={handleClose} aria-label={t("admin.close", "Kapat")}>
          ×
        </CloseButton>
        <ModalTitle>{t("modalTitle", "Katalog Talep Formu")}</ModalTitle>
        {successMessage ? (
          <SuccessMsg>{t("success")}</SuccessMsg>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <Input
              name="name"
              placeholder={t("form.name", "Ad Soyad")}
              required
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="email"
              placeholder={t("form.email", "E-posta")}
              required
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="company"
              placeholder={t("form.company", "Firma Adı")}
              value={form.company}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="phone"
              placeholder={t("form.phone", "Telefon")}
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />
            <Input
              name="subject"
              placeholder={t("form.subject", "Konu")}
              value={form.subject}
              onChange={handleChange}
              disabled={loading}
            />
            <Textarea
              name="message"
              placeholder={t("form.message", "Ek mesaj veya notunuz...")}
              value={form.message}
              onChange={handleChange}
              disabled={loading}
            />
            <SubmitBtn type="submit" disabled={loading}>
              {loading ? t("form.sending", "Gönderiliyor...") : t("form.send", "Gönder")}
            </SubmitBtn>
          </form>
        )}
      </Modal>
    </Overlay>
  );
}

/* ---------------- Styled Components ---------------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlayBackground};
  z-index: ${({ theme }) => theme.zIndex.overlay};
`;

const Modal = styled(motion.div)<{ $offsetTop: string }>`
  width: 380px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.radii.xl} 0 0 ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacings.xxl} ${({ theme }) => theme.spacings.xl}
    ${({ theme }) => theme.spacings.lg} ${({ theme }) => theme.spacings.xl};
  box-shadow: ${({ theme }) => theme.shadows.form};
  position: fixed;
  right: 0;
  top: ${({ $offsetTop }) => $offsetTop};   /* transient prop kullanımı */
  display: flex;
  flex-direction: column;
  min-height: 350px;
  font-family: ${({ theme }) => theme.fonts.body};

  ${({ theme }) => theme.media.small} {
    width: 100vw;
    right: 0;
    left: 0;
    top: 0;
    border-radius: 0;
    padding: ${({ theme }) => theme.spacings.lg};
    min-height: unset;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacings.md};
  right: ${({ theme }) => theme.spacings.lg};
  font-size: 2.1em;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.66;
  cursor: pointer;
  z-index: 2;
  transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover { opacity: 1; }
`;

const ModalTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacings.md};
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  letter-spacing: 0.01em;
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  padding: 0.95em 1em;
  font-size: ${({ theme }) => theme.fontSizes.base};
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  transition: border ${({ theme }) => theme.transition.fast};
  font-family: ${({ theme }) => theme.fonts.body};
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    outline: none;
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.placeholder};
    opacity: 1;
  }
  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    background: ${({ theme }) => theme.colors.inputBackgroundLight};
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 66px;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  padding: 0.95em 1em;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.inputBackground};
  font-family: ${({ theme }) => theme.fonts.body};
  resize: vertical;
  transition: border ${({ theme }) => theme.transition.fast};
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    outline: none;
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.placeholder};
    opacity: 1;
  }
  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    background: ${({ theme }) => theme.colors.inputBackgroundLight};
    cursor: not-allowed;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 1em 1em;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.button};
  margin-top: ${({ theme }) => theme.spacings.sm};
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: ${({ theme }) => theme.fonts.body};
  letter-spacing: 0.01em;
  &:hover:not(:disabled) { background: ${({ theme }) => theme.buttons.primary.backgroundHover}; }
  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    cursor: not-allowed;
    background: ${({ theme }) => theme.colors.disabledBg};
  }
`;

const SuccessMsg = styled.div`
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.md};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacings.xl};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
