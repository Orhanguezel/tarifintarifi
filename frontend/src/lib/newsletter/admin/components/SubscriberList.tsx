"use client";

import styled from "styled-components";
import type { INewsletter } from "@/modules/newsletter/types";

interface Props {
  subscribers: INewsletter[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onVerify: (id: string) => void;
  onSingleSend: (subscriber: INewsletter) => void;
  selectedId: string | null;
  t: (key: string, defaultValue?: string, vars?: Record<string, any>) => string;
}

export default function SubscriberList({
  subscribers,
  onSelect,
  onDelete,
  onVerify,
  onSingleSend,
  selectedId,
  t,
}: Props) {
  if (!subscribers.length) return <Empty>{t("admin.noSubscribers", "Hiç abone yok.")}</Empty>;

  return (
    <Wrap>
      {/* Desktop */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>{t("admin.email", "E-posta")}</th>
              <th>{t("admin.status", "Durum")}</th>
              <th>{t("admin.date", "Tarih")}</th>
              <th aria-label={t("admin.actions", "İşlemler")} />
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub._id} className={selectedId === sub._id ? "active" : ""}>
                <td
                  onClick={() => onSelect(sub._id)}
                  style={{ cursor: "pointer", fontWeight: 500, wordBreak: "break-all" }}
                  title={t("admin.selectTooltip", "Detayları göster")}
                >
                  {sub.email}
                </td>
                <td>
                  {sub.verified ? (
                    <Badge $on>{t("admin.verified", "Onaylı")}</Badge>
                  ) : (
                    <LinkBtn type="button" onClick={() => onVerify(sub._id)}>
                      {t("admin.verify", "Onayla")}
                    </LinkBtn>
                  )}
                </td>
                <td>{sub.subscribeDate ? new Date(sub.subscribeDate).toLocaleDateString() : "-"}</td>
                <td className="actions">
                  <Row>
                    <Secondary onClick={() => onSingleSend(sub)}>
                      {t("admin.sendSingle", "Tekil Gönder")}
                    </Secondary>
                    <Danger onClick={() => onDelete(sub._id)}>
                      {t("admin.delete", "Sil")}
                    </Danger>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile */}
      <CardsWrap>
        {subscribers.map((sub) => (
          <Card key={sub._id} $active={selectedId === sub._id}>
            <CardHeader>
              <HeaderLeft>
                <EmailBtn onClick={() => onSelect(sub._id)} title={t("admin.selectTooltip", "Detayları göster")}>
                  {sub.email}
                </EmailBtn>
              </HeaderLeft>
              <Status $on={sub.verified}>
                {sub.verified ? t("admin.verified", "Onaylı") : t("admin.unverified", "Onaysız")}
              </Status>
            </CardHeader>

            <CardBody>
              <SmallText>
                {t("admin.date", "Tarih")}: {sub.subscribeDate ? new Date(sub.subscribeDate).toLocaleDateString() : "-"}
              </SmallText>
            </CardBody>

            <CardActions>
              <Secondary onClick={() => onSingleSend(sub)}>{t("admin.sendSingle", "Tekil Gönder")}</Secondary>
              <Danger onClick={() => onDelete(sub._id)}>{t("admin.delete", "Sil")}</Danger>
            </CardActions>
          </Card>
        ))}
      </CardsWrap>
    </Wrap>
  );
}

/* styled — matches admin list pattern */
const Wrap = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;

const Empty = styled.div`
  text-align:center;
  color:${({theme})=>theme.colors.textSecondary};
  opacity:.9;
`;

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
    font-size:${({theme})=>theme.fontSizes.sm};vertical-align:middle;
  }
  td.actions{text-align:right;}
  tbody tr.active td{ background:${({theme})=>theme.colors.primaryLight}; }
  tbody tr:hover td{ background:${({theme})=>theme.colors.hoverBackground}; }
`;

const CardsWrap = styled.div`
  display:none;
  ${({theme})=>theme.media.mobile}{
    display:grid;grid-template-columns:1fr;gap:${({theme})=>theme.spacings.md};
  }
`;

const Card = styled.article<{ $active?: boolean }>`
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme,$active})=>$active?theme.colors.primary:theme.colors.borderBright};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;
`;

const CardHeader = styled.header`
  background:${({theme})=>theme.colors.primaryLight};
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md};
  display:flex;align-items:center;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};
  border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
`;

const HeaderLeft = styled.div`display:flex;align-items:center;gap:${({theme})=>theme.spacings.sm};`;
const EmailBtn = styled.button`
  background:none;border:none;padding:0;margin:0;cursor:pointer;
  color:${({theme})=>theme.colors.text};font-weight:${({theme})=>theme.fontWeights.medium};
  text-align:left;
  &:hover{ color:${({theme})=>theme.colors.primary}; text-decoration:underline; }
`;

const Status = styled.span<{ $on:boolean }>`
  padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;

const CardBody = styled.div`padding:${({theme})=>theme.spacings.md};`;
const SmallText = styled.span`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;

const CardActions = styled.div`
  display:flex;gap:${({theme})=>theme.spacings.xs};justify-content:flex-end;
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md} ${({theme})=>theme.spacings.md};
  border-top:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
`;

const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;`;

const BaseBtn = styled.button`
  padding:8px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;

const Secondary = styled(BaseBtn)`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
`;

const Danger = styled(BaseBtn)`
  background:${({theme})=>theme.colors.dangerBg};
  color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger};
  &:hover{
    background:${({theme})=>theme.colors.dangerHover};
    color:${({theme})=>theme.colors.textOnDanger};
    border-color:${({theme})=>theme.colors.dangerHover};
  }
`;

const LinkBtn = styled.button`
  background:none;border:none;color:${({theme})=>theme.colors.warning};
  font-weight:${({theme})=>theme.fontWeights.semiBold};cursor:pointer;padding:0;
  &:hover{ text-decoration:underline; }
`;

const Badge = styled.span<{ $on?: boolean }>`
  display:inline-block;padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;
