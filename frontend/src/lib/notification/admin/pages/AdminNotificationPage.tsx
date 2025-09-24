"use client";

import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toast } from "react-toastify";
import {
  fetchAdminNotifications,
  deleteNotification,
  markNotificationAsRead,
  adminMarkAllNotificationsAsRead,
  clearNotificationMessages,
} from "@/modules/notification/slice/notificationSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/notification/locales";
import { NotificationTable } from "@/modules/notification";
import type { SupportedLocale } from "@/types/common";
import { Loading, ErrorMessage, Empty } from "@/shared";

export default function AdminNotificationPage() {
  const dispatch = useAppDispatch();
  const { i18n, t } = useI18nNamespace("notification", translations);
  const lang: SupportedLocale = (i18n.language?.slice(0, 2) as SupportedLocale) || "en";

  // v2 slice state
  const { items = [], loading, error, message } = useAppSelector((s) => s.notification);

  const count = useMemo(() => (Array.isArray(items) ? items.length : 0), [items]);

  useEffect(() => {
    dispatch(fetchAdminNotifications({ page: 1, limit: 20, sort: "-createdAt" }));
  }, [dispatch]);

  useEffect(() => {
    if (message) toast.success(message);
    if (error) toast.error(error);
    if (message || error) dispatch(clearNotificationMessages());
  }, [message, error, dispatch]);

  return (
    <PageWrap>
      {/* Header — admin patern */}
      <Header>
        <TitleBlock>
          <h1>{t("title", "Bildirim Yönetimi")}</h1>
          <Subtitle>{t("subtitle", "Sistem bildirimlerini görüntüle ve yönet")}</Subtitle>
        </TitleBlock>
        <Right>
          <Counter aria-label="notification-count">{count}</Counter>
          <PrimaryBtn
            onClick={() => dispatch(adminMarkAllNotificationsAsRead())}
            disabled={loading || count === 0}
          >
            {t("markAllRead", "Tümünü Okundu Yap")}
          </PrimaryBtn>
        </Right>
      </Header>

      <Section>
        <SectionHead>
          <h2>{t("list", "Notifications")}</h2>
          <SmallBtn
            onClick={() =>
              dispatch(fetchAdminNotifications({ page: 1, limit: 20, sort: "-createdAt" }))
            }
            disabled={loading}
          >
            {t("refresh", "Refresh")}
          </SmallBtn>
        </SectionHead>

        <Card>
          {loading && <Loading />}
          {error && <ErrorMessage />}
          {!loading && items.length === 0 && <Empty t={t} />}

          {!loading && items.length > 0 && (
            <TableWrap>
              <NotificationTable
                notifications={items}
                lang={lang}
                onMarkRead={(id) => dispatch(markNotificationAsRead(id))}
                onDelete={(id) => dispatch(deleteNotification(id))}
              />
            </TableWrap>
          )}
        </Card>
      </Section>
    </PageWrap>
  );
}

/* ---- styled (opsjobs/about paternine uyumlu) ---- */
const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} {
    flex-direction: column; align-items: flex-start; gap: ${({ theme }) => theme.spacings.sm};
  }
`;

const TitleBlock = styled.div`
  display:flex; flex-direction:column; gap:4px;
  h1 { margin: 0; }
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Right = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;
`;

const Counter = styled.span`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacings.sm};
`;

const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.lg};
`;

const TableWrap = styled.div`
  width:100%;
  overflow-x:auto;
  border-radius:${({ theme }) => theme.radii.lg};
`;

const PrimaryBtn = styled.button`
  background:${({ theme }) => theme.buttons.primary.background};
  color:${({ theme }) => theme.buttons.primary.text};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.buttons.primary.backgroundHover};
  padding:8px 12px; border-radius:${({ theme }) => theme.radii.md};
  cursor:pointer;
  &:hover:enabled{ background:${({ theme }) => theme.buttons.primary.backgroundHover}; }
  &:disabled{ opacity: .6; cursor: not-allowed; }
`;

const SmallBtn = styled.button`
  background:${({ theme }) => theme.buttons.secondary.background};
  color:${({ theme }) => theme.buttons.secondary.text};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding:6px 10px; border-radius:${({ theme }) => theme.radii.md};
  cursor:pointer;
  &:disabled{ opacity:.6; cursor:not-allowed; }
`;
