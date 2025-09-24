"use client";
import styled from "styled-components";
import { useMemo } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/blog/locales";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteBlogCategory } from "@/modules/blog/slice/blogCategorySlice";
import type { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES, getMultiLang } from "@/types/common";
import type { BlogCategory } from "@/modules/blog/types";

type Props = {
  onAdd: () => void;
  onEdit: (category: BlogCategory) => void;
};

const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0,2).toLowerCase();
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(two) ? (two as SupportedLocale) : "tr";
};

export default function CategoryListPage({ onAdd, onEdit }: Props) {
  const { t, i18n } = useI18nNamespace("blog", translations);
  const lang = useMemo<SupportedLocale>(()=>getUILang(i18n?.language), [i18n?.language]);
  const dispatch = useAppDispatch();

  const { categories = [], loading, error } = useAppSelector((s)=> (s as any).blogCategory || {});

  const remove = async (id: string) => {
    if (!confirm(t("confirm.delete_category","Kategoriyi silmek istiyor musunuz?"))) return;
    await dispatch(deleteBlogCategory(id) as any).unwrap().catch(()=>{});
  };

  return (
    <Wrap>
      <Header>
        <h2>{t("categories","Categories")}</h2>
        <Primary onClick={onAdd}>+ {t("newCategory","New Category")}</Primary>
      </Header>

      {error && <ErrorBox role="alert">{String(error)}</ErrorBox>}

      <TableWrap aria-busy={!!loading}>
        <Table>
          <thead>
            <tr>
              <th>{t("name","Name")}</th>
              <th>{t("slug","Slug")}</th>
              <th>{t("isActive","Active?")}</th>
              <th aria-label={t("actions","Actions")}/>
            </tr>
          </thead>
          <tbody>
            {categories.length===0 && !loading && (
              <tr><td colSpan={4}><Empty>∅</Empty></td></tr>
            )}
            {categories.map((c: BlogCategory)=>{
              const name = getMultiLang(c.name as any, lang) || c.slug;
              return (
                <tr key={c._id}>
                  <td title={name}>{name}</td>
                  <td className="mono">{c.slug}</td>
                  <td><Badge $on={c.isActive}>{c.isActive? t("yes","Yes") : t("no","No")}</Badge></td>
                  <td className="actions">
                    <Row>
                      <Secondary onClick={()=>onEdit(c)}>{t("edit","Edit")}</Secondary>
                      <Danger onClick={()=>remove(c._id)}>{t("delete","Delete")}</Danger>
                    </Row>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </Wrap>
  );
}

/* styled */
const Wrap = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;
const Header = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const ErrorBox = styled.div`padding:${({theme})=>theme.spacings.sm};border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.danger};color:${({theme})=>theme.colors.danger};border-radius:${({theme})=>theme.radii.md};`;
const TableWrap = styled.div`
  width:100%;overflow-x:auto;border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};background:${({theme})=>theme.colors.cardBackground};
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
const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};justify-content:flex-end;`;
const Primary = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 12px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;
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
  text-align:center;color:${({theme})=>theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.sm};padding:${({theme})=>theme.spacings.md};
  font-style:italic;
  ${({theme})=>theme.media.mobile}{font-size:${({theme})=>theme.fontSizes.xsmall};}
`;
