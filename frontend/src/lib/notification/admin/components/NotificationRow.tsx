// NotificationRow.tsx
"use client";
import React from "react";
import styled from "styled-components";
import type { INotification } from "@/modules/notification/types";
import type { SupportedLocale } from "@/types/common";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/notification/locales";
import NotificationActions from "./NotificationActions";

interface Props {
  notification: INotification;
  lang: SupportedLocale;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

type UserRef = string | { _id: string; name?: string; email?: string } | null | undefined;
const isUserObj = (u: UserRef): u is { _id: string; name?: string; email?: string } =>
  typeof u === "object" && u !== null && "_id" in u;

const getUserEmail = (u: UserRef) => (isUserObj(u) ? u.email || "-" : "-");

const pickLocalized = (
  obj: Partial<Record<SupportedLocale, string>> | undefined,
  lang: SupportedLocale
): string => {
  if (!obj) return "-";
  return obj[lang] ?? obj.en ?? (Object.values(obj).find((v): v is string => !!v) ?? "-");
};

export default function NotificationRow({ notification, lang, onMarkRead, onDelete }: Props) {
  const { t } = useI18nNamespace("notification", translations);

  const scope =
    isUserObj(notification.user)
      ? notification.user.name || notification.user._id
      : typeof notification.user === "string"
      ? notification.user
      : notification.target?.roles?.length
      ? `roles: ${notification.target.roles.join(", ")}`
      : notification.target?.allTenant
      ? "allTenant"
      : "-";

  return (
    <tr>
      <td>{t(`type_${notification.type}`, notification.type)}</td>
      <td>{scope}</td>
      <td>{getUserEmail(notification.user)}</td>
      <td>{pickLocalized(notification.title, lang)}</td>
      <td>{pickLocalized(notification.message, lang)}</td>
      <td>{new Date(notification.createdAt as any).toLocaleString(lang)}</td>
      <td>
        <Badge $on={notification.isRead}>
          {notification.isRead ? t("read", "Okundu") : t("unread", "Okunmadı")}
        </Badge>
      </td>
      <td>
        <NotificationActions
          isRead={notification.isRead}
          onMarkRead={() => onMarkRead(String(notification._id))}
          onDelete={() => onDelete(String(notification._id))}
        />
      </td>
    </tr>
  );
}

/* styled — status badge patern */
const Badge = styled.span<{ $on?: boolean }>`
  display:inline-block; padding:.2em .6em; border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.warningBackground};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.warning};
  font-size:${({theme})=>theme.fontSizes.xsmall};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderHighlight};
  min-width:70px; text-align:center;
`;
