// NotificationActions.tsx
"use client";
import React from "react";
import styled from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/notification/locales";

interface Props {
  isRead: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
}

export default function NotificationActions({ isRead, onMarkRead, onDelete }: Props) {
  const { t } = useI18nNamespace("notification", translations);
  return (
    <Row>
      {!isRead && <Secondary onClick={onMarkRead}>{t("markRead", "Okundu Yap")}</Secondary>}
      <Danger onClick={onDelete}>{t("delete", "Sil")}</Danger>
    </Row>
  );
}

/* styled — list/actions patern */
const Row = styled.div`
  display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;
`;

const Secondary = styled.button`
  padding:8px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;

const Danger = styled(Secondary)`
  background:${({theme})=>theme.colors.dangerBg};
  color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger};
  &:hover{
    background:${({theme})=>theme.colors.dangerHover};
    color:${({theme})=>theme.colors.textOnDanger};
    border-color:${({theme})=>theme.colors.dangerHover};
  }
`;
