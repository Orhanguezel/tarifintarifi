// NotificationButton.tsx
"use client";

import Link from "next/link";
import styled from "styled-components";
import { Bell } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { fetchUnreadCount } from "@/modules/notification/slice/notificationSlice";

interface Props {
  ariaLabel?: string;
}

export default function NotificationButton({ ariaLabel }: Props) {
  const profile = useAppSelector((state) => state.account.profile);
  const unreadCount = useAppSelector((state) => state.notification.unreadCount ?? 0);
  const dispatch = useAppDispatch();

  const isAdmin = !!profile && (profile.role === "admin" || profile.role === "superadmin");

  useEffect(() => {
    if (isAdmin) dispatch(fetchUnreadCount());
  }, [isAdmin, dispatch]);

  if (!isAdmin) return null;

  return (
    <IconWrapper href="/admin/notification" aria-label={ariaLabel || "Notifications"} title="Bildirimler">
      <Bell size={20} />
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
    </IconWrapper>
  );
}

/* styled */
const IconWrapper = styled(Link)`
  position: relative; display:flex; align-items:center; justify-content:center;
  color:${({theme})=>theme.colors.primary};
  border-radius:${({theme})=>theme.radii.circle};
  padding:${({theme})=>theme.spacings.xs};
  transition: background .18s;
  &:hover{ background:${({theme})=>theme.colors.backgroundAlt}; }
`;

const Badge = styled.span`
  position:absolute; top:0; right:0;
  min-width: 18px; height: 18px; padding:0 6px;
  border-radius:${({theme})=>theme.radii.pill};
  background:${({theme})=>theme.colors.danger}; color:#fff;
  font-size:${({theme})=>theme.fontSizes.xsmall}; font-weight:${({theme})=>theme.fontWeights.bold};
  display:flex; align-items:center; justify-content:center;
  border:2px solid ${({theme})=>theme.colors.cardBackground};
  box-shadow:0 0 4px rgba(0,0,0,.08);
  pointer-events:none;
`;
