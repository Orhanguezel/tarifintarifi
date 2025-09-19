"use client";

import styled from "styled-components";
import Image from "next/image";
import type { Recipe } from "@/lib/recipes/types";

type Props = {
  recipes: Recipe[];
  loading?: boolean;
  error?: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
};

export default function RecipeList({
  recipes,
  loading,
  error,
  onEdit,
  onDelete,
  onTogglePublish,
}: Props) {
  const d = (v?: unknown) => {
    if (!v) return "-";
    const raw =
      typeof v === "string"
        ? v
        : (v as any)?.$date || (v as any)?.date || (v as any)?.value || String(v);
    const dt = new Date(raw);
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
  };

  const getThumb = (r: Recipe) => {
    const img = r.images?.[0];
    return img?.thumbnail || img?.webp || img?.url || undefined;
  };

  return (
    <Wrap>
      {error && <ErrorBox role="alert">{error}</ErrorBox>}

      {/* Desktop */}
      <TableWrap aria-busy={!!loading}>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 72 }}>Görsel</th>
              <th>Başlık</th>
              <th>Kategori</th>
              <th>Durum</th>
              <th>Güncellenme</th>
              <th>Sıra</th>
              <th aria-label="Aksiyonlar" />
            </tr>
          </thead>
          <tbody>
            {!loading && recipes.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <Empty>∅</Empty>
                </td>
              </tr>
            )}
            {recipes.map((r) => {
              const title = r.title?.tr || r.title?.en || r.slugCanonical;
              const cat = r.category || "-";
              const src = getThumb(r);
              return (
                <tr key={r._id}>
                  <td>
                    <ThumbBox aria-hidden="true">
                      {src ? (
                        <Image
                          src={src}
                          alt={title || "recipe"}
                          fill
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <Placeholder>—</Placeholder>
                      )}
                    </ThumbBox>
                  </td>
                  <td title={title}>{title}</td>
                  <td>{cat}</td>
                  <td>
                    <Badge $on={!!r.isPublished}>
                      {r.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                  </td>
                  <td>{d(r.updatedAt as any)}</td>
                  <td className="mono">{r.order ?? 0}</td>
                  <td className="actions">
                    <Row>
                      <Secondary onClick={() => r._id && onEdit(r._id)}>Düzenle</Secondary>
                      <Secondary onClick={() => r._id && onTogglePublish(r._id, !!r.isPublished)}>
                        {r.isPublished ? "Yayından Al" : "Yayınla"}
                      </Secondary>
                      <Danger onClick={() => r._id && onDelete(r._id)}>Sil</Danger>
                    </Row>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile */}
      <CardsWrap aria-busy={!!loading}>
        {recipes.length === 0 && !loading && <Empty>∅</Empty>}
        {recipes.map((r) => {
          const title = r.title?.tr || r.title?.en || r.slugCanonical;
          const cat = r.category || "-";
          const src = getThumb(r);
          return (
            <Card key={r._id}>
              <CardHeader>
                <HeaderLeft>
                  <HeaderTop>
                    <ThumbBox aria-hidden="true">
                      {src ? (
                        <Image
                          src={src}
                          alt={title || "recipe"}
                          fill
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <Placeholder>—</Placeholder>
                      )}
                    </ThumbBox>
                    <TitleBox>
                      <NameTitle title={title || ""}>{title || "—"}</NameTitle>
                      <SmallText>{cat}</SmallText>
                    </TitleBox>
                  </HeaderTop>
                </HeaderLeft>
                <Status $on={!!r.isPublished}>
                  {r.isPublished ? "Yayında" : "Taslak"}
                </Status>
              </CardHeader>

              <CardBody>
                <SmallText>Güncellenme: {d(r.updatedAt as any)}</SmallText>
                <SmallText>
                  Sıra: <b className="mono">{r.order ?? 0}</b>
                </SmallText>
              </CardBody>

              <CardActions>
                <Secondary onClick={() => r._id && onEdit(r._id)}>Düzenle</Secondary>
                <Secondary onClick={() => r._id && onTogglePublish(r._id, !!r.isPublished)}>
                  {r.isPublished ? "Yayından Al" : "Yayınla"}
                </Secondary>
                <Danger onClick={() => r._id && onDelete(r._id)}>Sil</Danger>
              </CardActions>
            </Card>
          );
        })}
      </CardsWrap>
    </Wrap>
  );
}

/* styled (classic theme) */
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
  td.mono{font-family:${({theme})=>theme.fonts.mono};}
  td.actions{text-align:right;}
  tbody tr:hover td{background:${({theme})=>theme.colors.hoverBackground};}
`;
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
const Empty = styled.div`
  display:flex;align-items:center;justify-content:center;width:100%;height:100%;
  color:${({theme})=>theme.colors.textSecondary};
`;
