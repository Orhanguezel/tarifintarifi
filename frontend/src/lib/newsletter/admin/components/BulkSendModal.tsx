"use client";

import { useState } from "react";
import styled from "styled-components";

interface Props {
  onClose: () => void;
  onPreview: (subject: string, html: string) => void;
  onSubmit: (subject: string, html: string) => void;
  loading: boolean;
  t: (key: string, defaultValue?: string, vars?: Record<string, any>) => string;
}

export default function BulkSendModal({ onClose, onPreview, onSubmit, loading, t }: Props) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  const titleId = "bulk-send-modal-title";

  return (
    <Overlay onClick={onClose}>
      <Box
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <CloseBtn onClick={onClose} aria-label={t("admin.close", "Kapat")}>×</CloseBtn>

        <Title id={titleId}>{t("admin.bulkSend", "Toplu E-Posta Gönder")}</Title>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(subject, html);
          }}
        >
          <Label htmlFor="bulk-subject">{t("admin.subject", "Konu")}</Label>
          <Input
            id="bulk-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder={t("admin.subjectPlaceholder", "E-posta konusu")}
          />

          <Label htmlFor="bulk-html">{t("admin.htmlContent", "İçerik (HTML destekli)")}</Label>
          <Textarea
            id="bulk-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            required
            rows={7}
            placeholder={t("admin.htmlPlaceholder", "E-posta içeriği (HTML destekli)...")}
          />

          <Actions>
            <Secondary
              type="button"
              onClick={() => onPreview(subject, html)}
              disabled={!subject || !html || loading}
            >
              {t("admin.preview", "Önizle")}
            </Secondary>
            <Primary type="submit" disabled={loading}>
              {loading ? t("admin.sending", "Gönderiliyor...") : t("admin.send", "Gönder")}
            </Primary>
          </Actions>
        </Form>
      </Box>
    </Overlay>
  );
}

/* ---- styled (admin pattern) ---- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(30,38,51,0.28);
  z-index: 2050;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Box = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: ${({ theme }) => theme.spacings.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  min-width: 520px;
  max-width: 96vw;
  width: 680px;
  position: relative;
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.small} {
    min-width: 94vw;
    width: 94vw;
    padding: ${({ theme }) => theme.spacings.md};
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 1.6rem;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  &:hover { opacity: ${({ theme }) => theme.opacity.hover}; }
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacings.md} 0;
  color: ${({ theme }) => theme.colors.title};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
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
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  min-height: 120px;
  resize: vertical;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.xs};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacings.sm};
`;

const BaseBtn = styled.button`
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  border: ${({ theme }) => theme.borders.thin} transparent;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: ${({ theme }) => theme.transition.normal};
  &:disabled { opacity: ${({ theme }) => theme.opacity.disabled}; cursor: not-allowed; }
`;

const Primary = styled(BaseBtn)`
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  &:hover:not(:disabled) { background: ${({ theme }) => theme.buttons.primary.backgroundHover}; }
`;

const Secondary = styled(BaseBtn)`
  background: ${({ theme }) => theme.buttons.secondary.background};
  color: ${({ theme }) => theme.buttons.secondary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  &:hover:not(:disabled) { filter: brightness(0.98); }
`;
