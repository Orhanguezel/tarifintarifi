// NotificationTable.tsx
"use client";
import styled from "styled-components";
import type { INotification } from "@/modules/notification/types";
import type { SupportedLocale } from "@/types/common";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/notification/locales";
import NotificationRow from "./NotificationRow";

interface Props {
  notifications: INotification[];
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

const fmtDate = (d: string | Date, lang: SupportedLocale) => new Date(d).toLocaleString(lang);

export default function NotificationTable({ notifications, lang, onMarkRead, onDelete }: Props) {
  const { t } = useI18nNamespace("notification", translations);

  return (
    <Wrap>
      {/* Desktop Table */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>{t("type", "Tip")}</th>
              <th>{t("userOrScope", "Kullanıcı/Alan")}</th>
              <th>{t("email", "E-posta")}</th>
              <th>{t("title", "Başlık")}</th>
              <th>{t("message", "Mesaj")}</th>
              <th>{t("date", "Tarih")}</th>
              <th>{t("read", "Okundu")}</th>
              <th aria-label={t("actions", "Eylemler")} />
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <NotificationRow
                key={String(n._id)}
                notification={n}
                lang={lang}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile Cards */}
      <CardsWrap>
        {notifications.map((n) => {
          const scope = isUserObj(n.user)
            ? n.user.name || n.user._id
            : typeof n.user === "string"
            ? n.user
            : n.target?.roles?.length
            ? `roles: ${n.target.roles.join(", ")}`
            : n.target?.allTenant
            ? "allTenant"
            : "-";

        return (
          <Card key={String(n._id)}>
            <CardHeader>
              <HeaderLeft>
                <TitleBox>
                  <NameTitle>{t(`type_${n.type}`, n.type)}</NameTitle>
                  <SmallText>{scope}</SmallText>
                </TitleBox>
              </HeaderLeft>
              <Status $on={n.isRead}>
                {n.isRead ? t("read", "Okundu") : t("unread", "Okunmadı")}
              </Status>
            </CardHeader>

            <CardBody>
              <SmallText><b>{t("email","E-posta")}:</b> {getUserEmail(n.user)}</SmallText>
              <SmallText><b>{t("title","Başlık")}:</b> {pickLocalized(n.title, lang)}</SmallText>
              <SmallText><b>{t("message","Mesaj")}:</b> {pickLocalized(n.message, lang)}</SmallText>
              <SmallText><b>{t("date","Tarih")}:</b> {fmtDate(n.createdAt as any, lang)}</SmallText>
            </CardBody>

            <CardActions>
              {!n.isRead && <Secondary onClick={() => onMarkRead(String(n._id))}>{t("markRead","Okundu Yap")}</Secondary>}
              <Danger onClick={() => onDelete(String(n._id))}>{t("delete","Sil")}</Danger>
            </CardActions>
          </Card>
        )})}
      </CardsWrap>
    </Wrap>
  );
}

/* styled — about/list paternine uyumlu */
const Wrap = styled.div`width:100%;`;

const TableWrap = styled.div`
  width:100%;overflow-x:auto;border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};background:${({theme})=>theme.colors.cardBackground};
  ${({theme})=>theme.media.mobile}{display:none;}
`;

const Table = styled.table`
  width:100%;border-collapse:collapse;
  thead th{
    background:${({theme})=>theme.colors.tableHeader};
    color:${({theme})=>theme.colors.textSecondary};
    font-weight:${({theme})=>theme.fontWeights.semiBold};
    font-size:${({theme})=>theme.fontSizes.sm};
    padding:${({theme})=>theme.spacings.md};text-align:left;white-space:nowrap;
  }
  td{
    padding:${({theme})=>theme.spacings.md};
    border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
    font-size:${({theme})=>theme.fontSizes.sm}; vertical-align:top;
    max-width:360px; word-break:break-word;
  }
  tbody tr:hover td{background:${({theme})=>theme.colors.hoverBackground};}
`;

const CardsWrap = styled.div`
  display:none;
  ${({theme})=>theme.media.mobile}{
    display:grid;grid-template-columns:1fr;gap:${({theme})=>theme.spacings.md};
  }
`;

const Card = styled.article`
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;
`;

const CardHeader = styled.header`
  background:${({theme})=>theme.colors.primaryLight};
  color:${({theme})=>theme.colors.title};
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md};
  display:flex;align-items:center;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};
  border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
`;
const HeaderLeft = styled.div`display:flex;flex-direction:column;gap:2px;min-width:0;`;
const TitleBox = styled.div`display:flex;flex-direction:column;min-width:0;`;
const NameTitle = styled.span`
  font-size:${({theme})=>theme.fontSizes.sm};color:${({theme})=>theme.colors.textSecondary};
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70vw;
`;
const SmallText = styled.span`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;

const Status = styled.span<{ $on:boolean }>`
  padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;

const CardBody = styled.div`padding:${({theme})=>theme.spacings.md};display:flex;flex-direction:column;gap:6px;`;

const CardActions = styled.div`
  display:flex;gap:${({theme})=>theme.spacings.xs};justify-content:flex-end;
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md} ${({theme})=>theme.spacings.md};
  border-top:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
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
