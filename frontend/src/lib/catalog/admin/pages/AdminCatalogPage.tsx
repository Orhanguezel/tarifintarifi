"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAllCatalogRequests,
  deleteCatalogRequest,
  markCatalogRequestAsRead,
  clearCatalogState,
} from "@/modules/catalog/slice/catalogSlice";
import type { ICatalogRequest } from "@/modules/catalog/types";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/catalog/locales";
import { toast } from "react-toastify";

/* --- helpers --- */
const fmtDateTime = (v?: string) => {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.valueOf()) ? "-" : d.toLocaleString();
};

export default function AdminCatalogRequestsPage() {
  const { t } = useI18nNamespace("catalogRequest", translations);
  const dispatch = useAppDispatch();

  const { messagesAdmin, loading, error, successMessage, deleteStatus } = useAppSelector(
    (s) => s.catalog
  );

  const [selected, setSelected] = useState<ICatalogRequest | null>(null);
  const [search, setSearch] = useState("");

  // İlk yükleme
  useEffect(() => {
    dispatch(fetchAllCatalogRequests());
  }, [dispatch]);

  // Toast geri bildirimleri
  useEffect(() => {
    if (successMessage) toast.success(successMessage);
    if (error) toast.error(error);
    if (successMessage || error) dispatch(clearCatalogState());
  }, [successMessage, error, dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchAllCatalogRequests());
  }, [dispatch]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm(t("admin.confirmDelete", "Bu talebi silmek istiyor musunuz?"))) {
        await dispatch(deleteCatalogRequest(id));
        setSelected((curr) => (curr?._id === id ? null : curr));
      }
    },
    [dispatch, t]
  );

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await dispatch(markCatalogRequestAsRead(id));
    },
    [dispatch]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (messagesAdmin || []).filter((msg) =>
      [msg.name, msg.email, msg.company, msg.subject, msg.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [messagesAdmin, search]);

  return (
    <PageWrap>
      {/* Header */}
      <Header>
        <TitleBlock>
          <h1>{t("admin.catalogTitle", "Katalog Talepleri")}</h1>
          <Subtitle>{t("admin.subtitle", "Kullanıcı katalog isteklerini yönetin")}</Subtitle>
        </TitleBlock>
        <Right>
          <Counter aria-label="request-count">{messagesAdmin.length}</Counter>
          <PrimaryBtn onClick={onRefresh} disabled={loading}>
            {t("admin.refresh", "Yenile")}
          </PrimaryBtn>
        </Right>
      </Header>

      {/* Search bar */}
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.search", "Arama...")}
          aria-label={t("admin.search", "Arama...")}
        />
      </Toolbar>

      {/* Desktop Table */}
      <TableWrap aria-busy={!!loading}>
        <Table>
          <thead>
            <tr>
              <th>{t("admin.name", "Ad")}</th>
              <th>{t("admin.email", "E-posta")}</th>
              <th>{t("admin.subject", "Konu")}</th>
              <th>{t("admin.date", "Tarih")}</th>
              <th>{t("admin.status", "Durum")}</th>
              <th aria-label={t("admin.actions", "İşlemler")} />
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <Empty>∅</Empty>
                </td>
              </tr>
            ) : (
              filtered.map((msg) => (
                <tr key={msg._id}>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td>
                    <SubjectLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelected(msg);
                      }}
                    >
                      {msg.subject}
                    </SubjectLink>
                  </td>
                  <td>{fmtDateTime(msg.createdAt)}</td>
                  <td>
                    {msg.isRead ? (
                      <Badge $on>{t("admin.read", "Okundu")}</Badge>
                    ) : (
                      <Badge>{t("admin.unread", "Okunmadı")}</Badge>
                    )}
                  </td>
                  <td className="actions">
                    <Row>
                      {!msg.isRead && (
                        <Secondary onClick={() => handleMarkAsRead(msg._id!)}>
                          {t("admin.markRead", "Okundu Yap")}
                        </Secondary>
                      )}
                      <Danger
                        onClick={() => handleDelete(msg._id!)}
                        disabled={deleteStatus === "loading"}
                      >
                        {t("admin.delete", "Sil")}
                      </Danger>
                    </Row>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile Cards */}
      <CardsWrap aria-busy={!!loading}>
        {filtered.length === 0 && !loading && <Empty>∅</Empty>}
        {filtered.map((msg) => (
          <Card key={msg._id}>
            <CardHeader>
              <HeaderLeft>
                <NameTitle title={msg.name}>{msg.name}</NameTitle>
                <SmallText>{msg.email}</SmallText>
              </HeaderLeft>
              <Status $on={msg.isRead}>
                {msg.isRead ? t("admin.read", "Okundu") : t("admin.unread", "Okunmadı")}
              </Status>
            </CardHeader>

            <CardBody>
              <SmallText>
                <b>{t("admin.subject", "Konu")}:</b> {msg.subject}
              </SmallText>
              <SmallText>
                <b>{t("admin.date", "Tarih")}:</b> {fmtDateTime(msg.createdAt)}
              </SmallText>
              {msg.company && (
                <SmallText>
                  <b>{t("admin.company", "Firma")}:</b> {msg.company}
                </SmallText>
              )}
              {msg.phone && (
                <SmallText>
                  <b>{t("admin.phone", "Telefon")}:</b> {msg.phone}
                </SmallText>
              )}
            </CardBody>

            <CardActions>
              {!msg.isRead && (
                <Secondary onClick={() => handleMarkAsRead(msg._id!)}>
                  {t("admin.markRead", "Okundu Yap")}
                </Secondary>
              )}
              <Danger
                onClick={() => handleDelete(msg._id!)}
                disabled={deleteStatus === "loading"}
              >
                {t("admin.delete", "Sil")}
              </Danger>
              <Primary onClick={() => setSelected(msg)}>{t("admin.view", "Görüntüle")}</Primary>
            </CardActions>
          </Card>
        ))}
      </CardsWrap>

      {/* Modal */}
      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseX onClick={() => setSelected(null)}>×</CloseX>
            <h2 style={{ marginTop: 0 }}>{selected.subject}</h2>
            <p>
              <b>{t("admin.name", "Ad")}:</b> {selected.name}
            </p>
            <p>
              <b>{t("admin.email", "E-posta")}:</b> {selected.email}
            </p>
            {selected.company && (
              <p>
                <b>{t("admin.company", "Firma")}:</b> {selected.company}
              </p>
            )}
            <p>
              <b>{t("admin.phone", "Telefon")}:</b> {selected.phone || "-"}
            </p>
            <p>
              <b>{t("admin.message", "Mesaj")}:</b>
              <br />
              {selected.message || "-"}
            </p>
            {selected.sentCatalog?.url && (
              <p>
                <b>{t("admin.catalogFile", "Katalog Dosyası")}:</b>{" "}
                <a href={selected.sentCatalog.url} target="_blank" rel="noopener noreferrer">
                  {selected.sentCatalog.fileName || selected.sentCatalog.url}
                </a>
              </p>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrap>
  );
}

/* ---------------- styled (classicTheme) ---------------- */

const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};
`;

const Header = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} {
    flex-direction:column; align-items:flex-start; gap:${({ theme }) => theme.spacings.sm};
  }
`;
const TitleBlock = styled.div`display:flex; flex-direction:column; gap:4px; h1{ margin:0; }`;
const Subtitle = styled.p`
  margin:0; color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.sm};
`;
const Right = styled.div`display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;`;
const Counter = styled.span`
  padding:6px 10px; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ theme }) => theme.colors.backgroundAlt};
  font-weight:${({ theme }) => theme.fontWeights.medium};
`;

const Toolbar = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm}; justify-content:flex-end;
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;

const SearchInput = styled.input`
  font-size:${({ theme }) => theme.fontSizes.sm};
  padding:10px 12px;
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  border-radius:${({ theme }) => theme.radii.md};
  min-width:260px;
  background:${({ theme }) => theme.inputs.background};
  color:${({ theme }) => theme.inputs.text};
  &::placeholder{ color:${({ theme }) => theme.inputs.placeholder}; }
`;

const PrimaryBtn = styled.button`
  background:${({ theme }) => theme.buttons.primary.background};
  color:${({ theme }) => theme.buttons.primary.text};
  border:${({ theme }) => theme.borders.thin} transparent;
  padding:8px 12px; border-radius:${({ theme }) => theme.radii.md}; cursor:pointer;
  transition:opacity ${({ theme }) => theme.transition.normal};
  &:hover{ opacity:${({ theme }) => theme.opacity.hover}; background:${({ theme }) => theme.buttons.primary.backgroundHover}; }
  &:disabled{ opacity:${({ theme }) => theme.opacity.disabled}; cursor:not-allowed; }
`;

const TableWrap = styled.div`
  width:100%; overflow-x:auto; border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  background:${({ theme }) => theme.colors.cardBackground};
  ${({ theme }) => theme.media.mobile}{ display:none; }
`;
const Table = styled.table`
  width:100%; border-collapse:collapse;
  thead th{
    background:${({ theme }) => theme.colors.tableHeader};
    color:${({ theme }) => theme.colors.textSecondary};
    font-weight:${({ theme }) => theme.fontWeights.semiBold};
    font-size:${({ theme }) => theme.fontSizes.sm};
    padding:${({ theme }) => theme.spacings.md}; text-align:left; white-space:nowrap;
  }
  td{
    padding:${({ theme }) => theme.spacings.md};
    border-bottom:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
    font-size:${({ theme }) => theme.fontSizes.sm}; vertical-align:middle;
  }
  td.actions{ text-align:right; }
  tbody tr:hover td{ background:${({ theme }) => theme.colors.hoverBackground}; }
`;
const SubjectLink = styled.a`
  color:${({ theme }) => theme.colors.link};
  &:hover{ color:${({ theme }) => theme.colors.linkHover}; text-decoration:underline; }
`;

const CardsWrap = styled.div`
  display:none;
  ${({ theme }) => theme.media.mobile} {
    display:grid; grid-template-columns:1fr; gap:${({ theme }) => theme.spacings.md};
  }
`;
const Card = styled.article`
  background:${({ theme }) => theme.colors.cardBackground};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
  border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  overflow:hidden;
`;
const CardHeader = styled.header`
  background:${({ theme }) => theme.colors.primaryLight};
  color:${({ theme }) => theme.colors.title};
  padding:${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  display:flex; align-items:center; justify-content:space-between; gap:${({ theme }) => theme.spacings.sm};
  border-bottom:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;
const HeaderLeft = styled.div`display:flex; flex-direction:column; gap:2px; min-width:0;`;
const NameTitle = styled.span`
  font-size:${({ theme }) => theme.fontSizes.sm};
  color:${({ theme }) => theme.colors.textSecondary};
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70vw;
`;
const SmallText = styled.span`font-size:${({ theme }) => theme.fontSizes.xsmall}; color:${({ theme }) => theme.colors.textSecondary};`;
const Status = styled.span<{ $on:boolean }>`
  padding:.2em .6em; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ $on, theme }) => ($on ? theme.colors.successBg : theme.colors.inputBackgroundLight)};
  color:${({ $on, theme }) => ($on ? theme.colors.success : theme.colors.textSecondary)};
  font-size:${({ theme }) => theme.fontSizes.xsmall};
`;
const CardBody = styled.div`padding:${({ theme }) => theme.spacings.md}; display:flex; flex-direction:column; gap:6px;`;
const CardActions = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.xs}; justify-content:flex-end;
  padding:${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md} ${({ theme }) => theme.spacings.md};
  border-top:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;

const Row = styled.div`display:flex; gap:${({ theme }) => theme.spacings.xs}; flex-wrap:wrap; justify-content:flex-end;`;

const BaseBtn = styled.button`
  padding:8px 10px; border-radius:${({ theme }) => theme.radii.md};
  border:${({ theme }) => theme.borders.thin} transparent; cursor:pointer;
  font-weight:${({ theme }) => theme.fontWeights.medium};
  box-shadow:${({ theme }) => theme.shadows.button};
  transition:opacity ${({ theme }) => theme.transition.normal};
  &:hover:not(:disabled){ opacity:${({ theme }) => theme.opacity.hover}; }
  &:disabled{ opacity:${({ theme }) => theme.opacity.disabled}; cursor:not-allowed; }
`;
const Secondary = styled(BaseBtn)`
  background:${({ theme }) => theme.buttons.secondary.background};
  color:${({ theme }) => theme.buttons.secondary.text};
  &:hover:not(:disabled){
    background:${({ theme }) => theme.buttons.secondary.backgroundHover};
    color:${({ theme }) => theme.buttons.secondary.textHover};
  }
`;
const Primary = styled(BaseBtn)`
  background:${({ theme }) => theme.buttons.primary.background};
  color:${({ theme }) => theme.buttons.primary.text};
  &:hover:not(:disabled){ background:${({ theme }) => theme.buttons.primary.backgroundHover}; }
`;
const Danger = styled(BaseBtn)`
  background:${({ theme }) => theme.buttons.danger.background};
  color:${({ theme }) => theme.buttons.danger.text};
  &:hover:not(:disabled){ background:${({ theme }) => theme.buttons.danger.backgroundHover}; }
`;
const Badge = styled.span<{ $on?: boolean }>`
  display:inline-block; padding:.2em .6em; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ $on, theme }) => ($on ? theme.colors.successBg : theme.colors.warningBackground)};
  color:${({ $on, theme }) => ($on ? theme.colors.success : theme.colors.textOnWarning)};
  font-size:${({ theme }) => theme.fontSizes.xsmall};
`;

const Empty = styled.div`
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  color:${({ theme }) => theme.colors.textSecondary};
`;

/* Modal */
const ModalOverlay = styled.div`
  position:fixed; inset:0; background:${({ theme }) => theme.colors.overlayBackground};
  z-index:${({ theme }) => theme.zIndex.modal}; display:flex; justify-content:center; align-items:flex-start;
`;
const ModalContent = styled.div`
  width:520px; background:${({ theme }) => theme.colors.cardBackground};
  border-radius:${({ theme }) => theme.radii.xl}; margin:${({ theme }) => theme.spacings.xl} 0 0 0;
  padding:${({ theme }) => theme.spacings.lg}; box-shadow:${({ theme }) => theme.shadows.lg};
  position:relative; display:flex; flex-direction:column; min-height:320px; font-size:${({ theme }) => theme.fontSizes.md};
  ${({ theme }) => theme.media.mobile}{ width:90vw; }
`;
const CloseX = styled.button`
  position:absolute; top:12px; right:18px; font-size:${({ theme }) => theme.fontSizes.large};
  background:none; border:none; color:${({ theme }) => theme.colors.textSecondary};
  cursor:pointer; &:hover{ color:${({ theme }) => theme.colors.darkGrey}; }
`;
