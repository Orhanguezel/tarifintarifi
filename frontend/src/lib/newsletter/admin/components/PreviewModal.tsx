"use client";

import styled from "styled-components";

interface Props {
  subject: string;
  html: string;
  onClose: () => void;
  t: (key: string, defaultValue?: string, vars?: Record<string, any>) => string;
}

export default function PreviewModal({ subject, html, onClose, t }: Props) {
  const titleId = "preview-modal-title";

  return (
    <Overlay onClick={onClose}>
      <Box
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <CloseBtn onClick={onClose} aria-label={t("admin.close", "Kapat")}>×</CloseBtn>

        <Title id={titleId}>{t("admin.previewModalTitle", "E-Posta Önizleme")}</Title>

        <Row>
          <Label>{t("admin.subject", "Konu")}:</Label>
          <SubjectText title={subject}>{subject}</SubjectText>
        </Row>

        <Divider />

        <MailContent dangerouslySetInnerHTML={{ __html: html }} />
      </Box>
    </Overlay>
  );
}

/* ---- styled (admin pattern) ---- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(30,38,51,0.25);
  z-index: 2050;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Box = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: ${({ theme }) => theme.spacings.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  min-width: 360px;
  max-width: 840px;
  width: 96vw;
  position: relative;
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.small} {
    min-width: 90vw;
    max-width: 98vw;
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

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.xs};
  align-items: baseline;
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SubjectText = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Divider = styled.hr`
  margin: ${({ theme }) => theme.spacings.sm} 0;
  border: none;
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;

const MailContent = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.7;
  max-height: 65vh;
  overflow-y: auto;
  word-break: break-word;
  background: ${({ theme }) => theme.inputs.background};
  padding: ${({ theme }) => theme.spacings.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
`;
