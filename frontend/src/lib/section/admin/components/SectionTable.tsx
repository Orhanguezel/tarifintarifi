"use client";
import styled from "styled-components";
import { Button } from "@/shared";
import type { ISectionMeta, ISectionSetting } from "@/modules/section/types";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";
import type { SupportedLocale } from "@/types/common";

type Props = {
  metasAdmin: ISectionMeta[];
  settings: ISectionSetting[];
  onEdit: (meta: ISectionMeta, setting?: ISectionSetting) => void;
  onDelete: (meta: ISectionMeta, setting?: ISectionSetting) => void;
  onSelect: (sectionKey: string) => void;
  selectedKeys: string[];
};

export default function SectionTable({
  metasAdmin,
  settings,
  onEdit,
  onDelete,
  onSelect,
  selectedKeys,
}: Props) {
  const { i18n, t } = useI18nNamespace("section", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;

  const allSelected = metasAdmin.length > 0 && selectedKeys.length === metasAdmin.length;

  function toggleSelectAll() {
    if (allSelected) {
      metasAdmin.forEach((m) => {
        if (selectedKeys.includes(m.sectionKey)) onSelect(m.sectionKey);
      });
    } else {
      metasAdmin.forEach((m) => {
        if (!selectedKeys.includes(m.sectionKey)) onSelect(m.sectionKey);
      });
    }
  }

  return (
    <Wrap>
      {/* Desktop Table */}
      <Table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label={t("selectAll", "Select all")}
              />
            </th>
            <th>{t("section.sectionKey", "Key")}</th>
            <th>{t("section.label", "Label")}</th>
            <th>{t("section.enabled", "Enabled")}</th>
            <th>{t("section.order", "Order")}</th>
            <th>{t("section.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {metasAdmin.map((meta) => {
            const setting = settings.find((s) => s.sectionKey === meta.sectionKey);
            const enabled = setting?.enabled ?? meta.defaultEnabled;
            const order = setting?.order ?? meta.defaultOrder;
            const label =
              meta.label?.[lang] || meta.label?.en || Object.values(meta.label || {})[0] || "-";

            return (
              <tr key={meta.sectionKey}>
                <td>
                  <Checkbox
                    type="checkbox"
                    checked={selectedKeys.includes(meta.sectionKey)}
                    onChange={() => onSelect(meta.sectionKey)}
                    aria-label={`${t("select", "Select")} ${meta.sectionKey}`}
                  />
                </td>
                <td><Mono>{meta.sectionKey}</Mono></td>
                <td>{label}</td>
                <td><EnabledDot $enabled={!!enabled} aria-label={enabled ? t("on","On") : t("off","Off")} /></td>
                <td>{order}</td>
                <td className="actions">
                  <Button size="sm" variant="outline" onClick={() => onEdit(meta, setting)}>
                    {t("edit", "Edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(meta, setting)}
                    disabled={!setting}
                    style={{ marginLeft: 8 }}
                  >
                    {t("delete", "Delete")}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Mobile Cards */}
      <Cards>
        {metasAdmin.map((meta) => {
          const setting = settings.find((s) => s.sectionKey === meta.sectionKey);
          const enabled = setting?.enabled ?? meta.defaultEnabled;
          const order = setting?.order ?? meta.defaultOrder;
          const label =
            meta.label?.[lang] || meta.label?.en || Object.values(meta.label || {})[0] || "-";
          const selected = selectedKeys.includes(meta.sectionKey);

          return (
            <Card key={meta.sectionKey} $selected={selected}>
              <CardHead>
                <Checkbox
                  type="checkbox"
                  checked={selected}
                  onChange={() => onSelect(meta.sectionKey)}
                  aria-label={`${t("select", "Select")} ${meta.sectionKey}`}
                />
                <KeyText>{meta.sectionKey}</KeyText>
                <EnabledDot $enabled={!!enabled} />
              </CardHead>

              <Row>
                <Label>{t("section.label", "Label")}:</Label>
                <span>{label}</span>
              </Row>
              <Row>
                <Label>{t("section.order", "Order")}:</Label>
                <span>{order}</span>
              </Row>

              <Actions>
                <Button size="sm" variant="outline" onClick={() => onEdit(meta, setting)}>
                  {t("edit", "Edit")}
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(meta, setting)} disabled={!setting}>
                  {t("delete", "Delete")}
                </Button>
              </Actions>
            </Card>
          );
        })}
      </Cards>
    </Wrap>
  );
}

/* styled */
const Wrap = styled.div`width:100%;`;

/* Desktop table */
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  overflow: hidden;

  thead th{
    background:${({ theme }) => theme.colors.tableHeader};
    color:${({ theme }) => theme.colors.text};
    font-weight:${({ theme }) => theme.fontWeights.semiBold};
    font-size:${({ theme }) => theme.fontSizes.sm};
    padding:${({ theme }) => theme.spacings.md};
    text-align:left; white-space:nowrap;
    border-bottom:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  }
  td{
    padding:${({ theme }) => theme.spacings.md};
    border-bottom:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
    font-size:${({ theme }) => theme.fontSizes.sm};
    color:${({ theme }) => theme.colors.text};
    vertical-align:middle;
  }
  td.actions { text-align:right; }
  tbody tr:hover td{ background:${({ theme }) => theme.colors.hoverBackground}; }

  /* mobile'da gizle */
  ${({ theme }) => theme.media.small} { display:none; }
`;

/* Mobile cards */
const Cards = styled.div`
  display:none;
  ${({ theme }) => theme.media.small} {
    display:grid; grid-template-columns:1fr; gap:${({ theme }) => theme.spacings.md};
    margin-top:${({ theme }) => theme.spacings.md};
  }
`;
const Card = styled.article<{ $selected:boolean }>`
  background:${({ theme }) => theme.colors.cardBackground};
  border:${({ theme }) => theme.borders.thin} ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.border};
  border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  padding:${({ theme }) => theme.spacings.md};
  display:flex; flex-direction:column; gap:${({ theme }) => theme.spacings.sm};
`;
const CardHead = styled.header`
  display:flex; align-items:center; gap:${({ theme }) => theme.spacings.sm};
  margin-bottom:${({ theme }) => theme.spacings.xs};
`;
const Checkbox = styled.input`
  accent-color:${({ theme }) => theme.colors.primary};
  width:18px; height:18px;
`;
const KeyText = styled.span`
  font-weight:${({ theme }) => theme.fontWeights.bold};
  color:${({ theme }) => theme.colors.textPrimary};
  font-size:${({ theme }) => theme.fontSizes.md};
  flex:1;
  word-break: break-all;
`;
const Row = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;
  font-size:${({ theme }) => theme.fontSizes.sm};
`;
const Label = styled.span`
  font-weight:${({ theme }) => theme.fontWeights.medium};
  color:${({ theme }) => theme.colors.textSecondary};
  min-width:70px;
`;
const Actions = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.xs}; justify-content:flex-end;
`;
const EnabledDot = styled.span<{ $enabled:boolean }>`
  width:16px; height:16px; border-radius:50%;
  display:inline-block;
  background:${({ $enabled, theme }) => ($enabled ? theme.colors.success : theme.colors.danger)};
  box-shadow: 0 0 0 1.5px currentColor;
  color:${({ $enabled, theme }) => ($enabled ? theme.colors.success : theme.colors.danger)};
`;
const Mono = styled.code`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
