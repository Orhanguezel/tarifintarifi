"use client";
import styled from "styled-components";
import Image from "next/image";
import { useMemo } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/blog/locales";
import type { IBlog, BlogCategory } from "@/modules/blog/types";
import type { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES, getMultiLang } from "@/types/common";

type Props = {
  blog: IBlog[];
  lang: SupportedLocale;
  loading?: boolean;
  error?: string | null;
  onEdit: (item: IBlog) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  categories?: BlogCategory[];
};

const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(two)
    ? (two as SupportedLocale)
    : "tr";
};

export default function List({
  blog,
  lang,
  loading,
  error,
  onEdit,
  onDelete,
  onTogglePublish,
  categories,
}: Props) {
  const { t, i18n } = useI18nNamespace("blog", translations);
  const uiLang = useMemo<SupportedLocale>(() => getUILang(i18n?.language), [i18n?.language]);

  // id -> kategori adı
  const catLabelById = useMemo(() => {
    const m = new Map<string, string>();
    (categories || []).forEach((c) =>
      m.set(c._id, getMultiLang(c.name as any, uiLang) || c.slug || c._id)
    );
    return m;
  }, [categories, uiLang]);

  // { $date } / string / Date -> localized string
  const d = (v?: unknown) => {
    if (!v) return "-";
    const raw =
      typeof v === "string"
        ? v
        : (v as any)?.$date || (v as any)?.date || (v as any)?.value || String(v);
    const dt = new Date(raw);
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
    };

  // Tüm category olasılıklarını ele al
  const getCategoryLabel = (a: IBlog): string => {
    const c: any = a?.category;
    if (!c) return "-";
    if (typeof c === "string") return catLabelById.get(c) || "-";
    // populate edilmiş obje: {_id, name}
    if (c?.name) return getMultiLang(c.name as any, uiLang) || "-";
    // extended json / partial obje: {$oid} | {_id}
    const id = c?.$oid || c?._id || c?.id;
    return id ? catLabelById.get(String(id)) || "-" : "-";
  };

  const getThumb = (a: IBlog): string | undefined => {
    const img = a?.images?.[0];
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
              <th style={{ width: 72 }}>{t("image", "Image")}</th>
              <th>{t("titleField", "Title")}</th>
              <th>{t("category", "Category")}</th>
              <th>{t("status", "Status")}</th>
              <th>{t("publishedAt", "Published At")}</th>
              <th>{t("order", "Order")}</th>
              <th aria-label={t("actions", "Actions")} />
            </tr>
          </thead>
          <tbody>
            {!loading && blog.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <Empty>∅</Empty>
                </td>
              </tr>
            )}
            {blog.map((a) => {
              const title = getMultiLang(a.title as any, lang) || a.slug;
              const catLabel = getCategoryLabel(a);
              const src = getThumb(a);
              return (
                <tr key={a._id}>
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
                  <td title={title}>{title}</td>
                  <td>{catLabel}</td>
                  <td>
                    <Badge $on={a.isPublished}>
                      {a.isPublished ? t("published", "Published") : t("draft", "Draft")}
                    </Badge>
                  </td>
                  <td>{d(a.publishedAt as any)}</td>
                  <td className="mono">{a.order ?? 0}</td>
                  <td className="actions">
                    <Row>
                      <Secondary onClick={() => onEdit(a)}>{t("edit", "Edit")}</Secondary>
                      <Secondary onClick={() => onTogglePublish(a._id, a.isPublished)}>
                        {a.isPublished ? t("unpublish", "Unpublish") : t("publish", "Publish")}
                      </Secondary>
                      <Danger onClick={() => onDelete(a._id)}>{t("delete", "Delete")}</Danger>
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
        {blog.length === 0 && !loading && <Empty>∅</Empty>}
        {blog.map((a) => {
          const title = getMultiLang(a.title as any, lang) || a.slug;
          const catLabel = getCategoryLabel(a);
          const src = getThumb(a);
          return (
            <Card key={a._id}>
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
                      <SmallText>{catLabel}</SmallText>
                    </TitleBox>
                  </HeaderTop>
                </HeaderLeft>
                <Status $on={a.isPublished}>
                  {a.isPublished ? t("published", "Published") : t("draft", "Draft")}
                </Status>
              </CardHeader>

              <CardBody>
                <SmallText>
                  {t("publishedAt", "Published At")}: {d(a.publishedAt as any)}
                </SmallText>
                <SmallText>
                  {t("order", "Order")}: <b className="mono">{a.order ?? 0}</b>
                </SmallText>
              </CardBody>

              <CardActions>
                <Secondary onClick={() => onEdit(a)}>{t("edit", "Edit")}</Secondary>
                <Secondary onClick={() => onTogglePublish(a._id, a.isPublished)}>
                  {a.isPublished ? t("unpublish", "Unpublish") : t("publish", "Publish")}
                </Secondary>
                <Danger onClick={() => onDelete(a._id)}>{t("delete", "Delete")}</Danger>
              </CardActions>
            </Card>
          );
        })}
      </CardsWrap>
    </Wrap>
  );
}

/* styled */
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
