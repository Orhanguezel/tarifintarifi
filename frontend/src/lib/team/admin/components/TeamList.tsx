"use client";

import styled from "styled-components";
import Image from "next/image";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/team/locales";
import type { ITeam, TranslatedField } from "@/modules/team/types";
import type { SupportedLocale } from "@/types/common";

interface Props {
  team: ITeam[] | undefined;
  lang: SupportedLocale;
  loading: boolean;
  error: string | null;
  onEdit?: (item: ITeam) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, isPublished: boolean) => void;
}

/** Çok dilli alan okuyucu */
const getTL = (obj?: TranslatedField, l?: SupportedLocale) =>
  (obj && ((l && obj[l]) || obj.en || obj.tr || Object.values(obj)[0])) || "—";

/** Tarih biçimlendirici (string | {$date} | Date) */
const d = (v?: unknown) => {
  if (!v) return "-";
  const raw =
    typeof v === "string"
      ? v
      : (v as any)?.$date || (v as any)?.date || (v as any)?.value || String(v);
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
};

export default function TeamList({
  team,
  lang,
  loading,
  error,
  onEdit,
  onDelete,
  onTogglePublish,
}: Props) {
  const { t } = useI18nNamespace("team", translations);

  const items = Array.isArray(team) ? team : [];

  const getCategoryLabel = (item: ITeam) =>
    typeof item.category === "string"
      ? item.category || t("none", "None")
      : getTL(item.category?.name, lang) || t("none", "None");

  const getThumb = (item: ITeam): string | undefined => {
    const img = item?.images?.[0];
    return img?.thumbnail || img?.webp || img?.url || undefined;
  };

  return (
    <Wrap>
      {error && <ErrorBox role="alert">❌ {error}</ErrorBox>}

      {/* Desktop Table */}
      <TableWrap aria-busy={!!loading}>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 72 }}>{t("image", "Image")}</th>
              <th>{t("title", "Title")}</th>
              <th>{t("team.category", "Category")}</th>
              <th>{t("team.publish_status", "Published")}</th>
              <th>{t("publishedAt", "Published At")}</th>
              <th aria-label={t("actions", "Actions")} />
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <Empty>∅</Empty>
                </td>
              </tr>
            )}
            {items.map((it) => {
              const title = getTL(it.title, lang);
              const cat = getCategoryLabel(it);
              const src = getThumb(it);
              return (
                <tr key={it._id}>
                  <td>
                    <ThumbBox aria-hidden="true">
                      {src ? (
                        <Image
                          src={src}
                          alt={title}
                          fill
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <Placeholder>—</Placeholder>
                      )}
                    </ThumbBox>
                  </td>
                  <td title={title}>
                    <TitleText>{title}</TitleText>
                    <SummaryText>{getTL(it.summary, lang)}</SummaryText>
                  </td>
                  <td>{cat}</td>
                  <td>
                    <Badge $on={!!it.isPublished}>
                      {it.isPublished ? t("yes", "Yes") : t("no", "No")}
                    </Badge>
                  </td>
                  <td>{d(it.publishedAt)}</td>
                  <td className="actions">
                    <Row>
                      {onEdit && (
                        <Secondary onClick={() => onEdit(it)}>
                          {t("edit", "Edit")}
                        </Secondary>
                      )}
                      {onTogglePublish && (
                        <Secondary onClick={() => onTogglePublish(it._id, it.isPublished)}>
                          {it.isPublished
                            ? t("team.unpublish", "Unpublish")
                            : t("team.publish", "Publish")}
                        </Secondary>
                      )}
                      {onDelete && (
                        <Danger onClick={() => onDelete(it._id)}>
                          {t("delete", "Delete")}
                        </Danger>
                      )}
                    </Row>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile Cards */}
      <CardsWrap aria-busy={!!loading}>
        {items.length === 0 && !loading && <Empty>∅</Empty>}
        {items.map((it) => {
          const title = getTL(it.title, lang);
          const cat = getCategoryLabel(it);
          const src = getThumb(it);
          return (
            <Card key={it._id}>
              <CardHeader>
                <HeaderLeft>
                  <HeaderTop>
                    <ThumbBox aria-hidden="true">
                      {src ? (
                        <Image
                          src={src}
                          alt={title}
                          fill
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <Placeholder>—</Placeholder>
                      )}
                    </ThumbBox>
                    <TitleBox>
                      <NameTitle title={title}>{title}</NameTitle>
                      <SmallText>{cat}</SmallText>
                    </TitleBox>
                  </HeaderTop>
                </HeaderLeft>
                <Status $on={!!it.isPublished}>
                  {it.isPublished ? t("published", "Published") : t("draft", "Draft")}
                </Status>
              </CardHeader>

              <CardBody>
                <SmallText>
                  {t("publishedAt", "Published At")}: {d(it.publishedAt)}
                </SmallText>
                <SmallText>
                  {t("team.tags", "Tags")}:{" "}
                  {it.tags?.length ? (
                    <TagsWrap>
                      {it.tags.map((tg) => (
                        <Tag key={tg}>{tg}</Tag>
                      ))}
                    </TagsWrap>
                  ) : (
                    t("none", "None")
                  )}
                </SmallText>
              </CardBody>

              <CardActions>
                {onEdit && (
                  <Secondary onClick={() => onEdit(it)}>{t("edit", "Edit")}</Secondary>
                )}
                {onTogglePublish && (
                  <Secondary onClick={() => onTogglePublish(it._id, it.isPublished)}>
                    {it.isPublished ? t("team.unpublish", "Unpublish") : t("team.publish", "Publish")}
                  </Secondary>
                )}
                {onDelete && (
                  <Danger onClick={() => onDelete(it._id)}>{t("delete", "Delete")}</Danger>
                )}
              </CardActions>
            </Card>
          );
        })}
      </CardsWrap>
    </Wrap>
  );
}

/* ----------------- styled ----------------- */

const Wrap = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;
const ErrorBox = styled.div`padding:${({theme})=>theme.spacings.sm};border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.danger};color:${({theme})=>theme.colors.danger};border-radius:${({theme})=>theme.radii.md};`;

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
  tbody tr:hover td{background:${({theme})=>theme.colors.hoverBackground};}
`;
const TitleText = styled.div`font-weight:${({theme})=>theme.fontWeights.semiBold};color:${({theme})=>theme.colors.text};`;
const SummaryText = styled.div`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};margin-top:2px;`;

const ThumbBox = styled.div`
  position:relative;width:64px;height:44px;border-radius:${({theme})=>theme.radii.sm};
  overflow:hidden;background:${({theme})=>theme.colors.inputBackgroundLight};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
  flex:0 0 auto;
`;
const Placeholder = styled.span`
  display:flex;align-items:center;justify-content:center;width:100%;height:100%;
  color:${({theme})=>theme.colors.textSecondary};
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
const HeaderTop = styled.div`display:flex;align-items:center;gap:${({theme})=>theme.spacings.sm};min-width:0;`;
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
const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;`;

const Secondary = styled.button`
  padding:8px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  &:hover{background:${({theme})=>theme.buttons.secondary.backgroundHover};color:${({theme})=>theme.buttons.secondary.textHover};}
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

const Badge = styled.span<{ $on:boolean }>`
  display:inline-block;padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
`;

const TagsWrap = styled.span`display:inline-flex;flex-wrap:wrap;gap:${({theme})=>theme.spacings.xs};`;
const Tag = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tagBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;

const Empty = styled.div`
  display:flex;align-items:center;justify-content:center;width:100%;height:100%;
  color:${({theme})=>theme.colors.textSecondary};
`;
