"use client";

import styled from "styled-components";
import type { INewsletter } from "@/modules/newsletter/types";

interface Props {
  subscriber: INewsletter;
  onClose: () => void;
  t: (key: string, defaultValue?: string, vars?: Record<string, any>) => string;
}

export default function SubscriberModal({ subscriber, onClose, t }: Props) {
  const titleId = "subscriber-modal-title";

  return (
    <Overlay onClick={onClose}>
      <Box
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <CloseBtn onClick={onClose} aria-label={t("admin.close", "Kapat")}>×</CloseBtn>

        <Title id={titleId}>{t("admin.details", "Abone Detayları")}</Title>

        <Info>
          <b>{t("admin.email", "E-posta")}:</b> {subscriber.email}
        </Info>
        <Info>
          <b>{t("admin.status", "Durum")}:</b>{" "}
          {subscriber.verified ? (
            <State $ok>{t("admin.verified", "Onaylı")}</State>
          ) : (
            <State>{t("admin.unverified", "Onaysız")}</State>
          )}
        </Info>
        <Info>
          <b>{t("admin.subscribedAt", "Abone Tarihi")}:</b>{" "}
          {subscriber.subscribeDate ? new Date(subscriber.subscribeDate).toLocaleString() : "-"}
        </Info>
        {subscriber.unsubscribeDate && (
          <Info>
            <b>{t("admin.unsubscribedAt", "Çıkış Tarihi")}:</b>{" "}
            {new Date(subscriber.unsubscribeDate).toLocaleString()}
          </Info>
        )}
      </Box>
    </Overlay>
  );
}

/* ---- styled (admin pattern) ---- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(30,38,51,0.19);
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Box = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.lg};
  min-width: 360px;
  max-width: 96vw;
  position: relative;
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.small} {
    padding: ${({ theme }) => theme.spacings.md};
    min-width: 90vw;
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
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.title};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const Info = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  b { font-weight: ${({ theme }) => theme.fontWeights.medium}; }
`;

const State = styled.span<{ $ok?: boolean }>`
  color: ${({ $ok, theme }) => ($ok ? theme.colors.success : theme.colors.warning)};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;
