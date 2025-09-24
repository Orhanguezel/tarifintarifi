// InvoiceList.tsx
"use client";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/invoices";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllInvoicesAdmin, changeInvoiceStatus, deleteInvoice } from "@/modules/invoices/slice/invoicesSlice";
import type { IInvoice, InvoiceListFilters, InvoiceStatus, InvoiceType } from "@/modules/invoices/types";

interface Props {
  items: IInvoice[];
  loading?: boolean;
  onEdit: (i: IInvoice) => void;
}

export default function InvoiceList({ items, loading, onEdit }: Props) {
  const { t } = useI18nNamespace("invoices", translations);
  const dispatch = useAppDispatch();

  const [filters, setFilters] = useState<InvoiceListFilters>({});
  const onChange = (k: keyof InvoiceListFilters, v: any) =>
    setFilters((s) => ({ ...s, [k]: v === "" ? undefined : v }));
  const applied = useMemo(()=>filters,[filters]);

  const d = (v?: string|Date) => v ? new Date(v).toLocaleDateString() : "-";

  return (
    <Wrap>
      <Toolbar role="region" aria-label={t("filters","Filters")}>
        <FilterRow>
          <Labeled>
            <Label>{t("q","Search code/buyer")}</Label>
            <Input value={filters.q || ""} onChange={(e)=>onChange("q", e.target.value)} />
          </Labeled>
          <Labeled>
            <Label>{t("type","Type")}</Label>
            <Select value={filters.type||""} onChange={(e)=>onChange("type",(e.target.value||undefined) as InvoiceType)}>
              <option value="">{t("all","All")}</option>
              {["invoice","creditNote"].map(x=> <option key={x} value={x}>{t(`type_${x}`, x)}</option>)}
            </Select>
          </Labeled>
          <Labeled>
            <Label>{t("status","Status")}</Label>
            <Select value={filters.status||""} onChange={(e)=>onChange("status",(e.target.value||undefined) as InvoiceStatus)}>
              <option value="">{t("all","All")}</option>
              {["draft","issued","sent","partially_paid","paid","canceled"].map(s=> <option key={s} value={s}>{t(`status_${s}`, s)}</option>)}
            </Select>
          </Labeled>
          <Labeled><Label>{t("customerId","Customer ID")}</Label><Input value={filters.customer||""} onChange={(e)=>onChange("customer",e.target.value)} /></Labeled>
          <Labeled><Label>{t("apartmentId","Apartment ID")}</Label><Input value={filters.apartment||""} onChange={(e)=>onChange("apartment",e.target.value)} /></Labeled>
          <Labeled><Label>{t("contractId","Contract ID")}</Label><Input value={filters.contract||""} onChange={(e)=>onChange("contract",e.target.value)} /></Labeled>
          <Labeled><Label>{t("billingPlanId","Billing Plan ID")}</Label><Input value={filters.billingPlan||""} onChange={(e)=>onChange("billingPlan",e.target.value)} /></Labeled>

          <Labeled>
            <Label>{t("issueFrom","Issue From")}</Label>
            <Input type="date" value={filters.issueFrom||""} onChange={(e)=>onChange("issueFrom",e.target.value)} />
          </Labeled>
          <Labeled>
            <Label>{t("issueTo","Issue To")}</Label>
            <Input type="date" value={filters.issueTo||""} onChange={(e)=>onChange("issueTo",e.target.value)} />
          </Labeled>
          <Labeled>
            <Label>{t("dueFrom","Due From")}</Label>
            <Input type="date" value={filters.dueFrom||""} onChange={(e)=>onChange("dueFrom",e.target.value)} />
          </Labeled>
          <Labeled>
            <Label>{t("dueTo","Due To")}</Label>
            <Input type="date" value={filters.dueTo||""} onChange={(e)=>onChange("dueTo",e.target.value)} />
          </Labeled>
        </FilterRow>

        <Actions>
          <Btn onClick={()=>dispatch(fetchAllInvoicesAdmin(applied))} disabled={loading} aria-busy={loading}>
            {t("apply","Apply")}
          </Btn>
          <Btn onClick={()=>{ setFilters({}); dispatch(fetchAllInvoicesAdmin()); }} disabled={loading}>
            {t("reset","Reset")}
          </Btn>
        </Actions>
      </Toolbar>

      {/* Desktop Table */}
      <Table aria-live="polite" aria-busy={loading}>
        <thead>
          <tr>
            <th>{t("code","Code")}</th>
            <th>{t("issueDate","Issue")}</th>
            <th>{t("dueDate","Due")}</th>
            <th>{t("buyer","Buyer")}</th>
            <th>{t("type","Type")}</th>
            <th>{t("grandTotal","Total")}</th>
            <th>{t("balance","Balance")}</th>
            <th>{t("status","Status")}</th>
            <th aria-label={t("actions","Actions")} />
          </tr>
        </thead>
        <tbody>
          {!loading && items.length===0 && <tr><td colSpan={9}><Empty>∅</Empty></td></tr>}
          {items.map(inv=>(
            <tr key={inv._id}>
              <td className="mono">{inv.code}</td>
              <td>{d(inv.issueDate)}</td>
              <td>{d(inv.dueDate)}</td>
              <td>{inv.buyer?.name || "-"}</td>
              <td>{t(`type_${inv.type}`, inv.type)}</td>
              <td className="mono">{Number(inv.totals?.grandTotal || 0).toFixed(2)} {inv.totals?.currency}</td>
              <td className="mono">{Number(inv.totals?.balance || 0).toFixed(2)} {inv.totals?.currency}</td>
              <td><Status $s={inv.status}>{t(`status_${inv.status}`, inv.status)}</Status></td>
              <td className="actions">
                <Row>
                  <Secondary onClick={()=>onEdit(inv)}>{t("edit","Edit")}</Secondary>
                  <Select
                    aria-label={t("changeStatus","Change status")}
                    value=""
                    onChange={(e)=>{
                      const s = e.target.value as InvoiceStatus; if(!s) return;
                      dispatch(changeInvoiceStatus({ id: inv._id, status: s }));
                      e.currentTarget.value = "";
                    }}
                  >
                    <option value="">{t("change","Change")}</option>
                    {["draft","issued","sent","partially_paid","paid","canceled"].map(s=><option key={s} value={s}>{t(`status_${s}`, s)}</option>)}
                  </Select>
                  <Danger onClick={()=>dispatch(deleteInvoice(inv._id))}>{t("delete","Delete")}</Danger>
                </Row>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Mobile Cards (no content loss) */}
      <CardList aria-live="polite" aria-busy={loading}>
        {items.length===0 && !loading && <Empty>∅</Empty>}
        {items.map(inv=>(
          <Card key={inv._id}>
            <CardHeader>
              <Code className="mono">{inv.code}</Code>
              <Status $s={inv.status}>{t(`status_${inv.status}`, inv.status)}</Status>
            </CardHeader>
            <CardBody>
              <Line><Field>{t("issueDate","Issue")}</Field><Value>{d(inv.issueDate)}</Value></Line>
              <Line><Field>{t("dueDate","Due")}</Field><Value>{d(inv.dueDate)}</Value></Line>
              <Line><Field>{t("buyer","Buyer")}</Field><Value>{inv.buyer?.name || "-"}</Value></Line>
              <Line><Field>{t("type","Type")}</Field><Value>{t(`type_${inv.type}`, inv.type)}</Value></Line>
              <Line><Field>{t("grandTotal","Total")}</Field><Value className="mono">{Number(inv.totals?.grandTotal || 0).toFixed(2)} {inv.totals?.currency}</Value></Line>
              <Line><Field>{t("balance","Balance")}</Field><Value className="mono">{Number(inv.totals?.balance || 0).toFixed(2)} {inv.totals?.currency}</Value></Line>
            </CardBody>
            <Buttons>
              <Secondary onClick={()=>onEdit(inv)}>{t("edit","Edit")}</Secondary>
              <Select
                aria-label={t("changeStatus","Change status")}
                value=""
                onChange={(e)=>{
                  const s = e.target.value as InvoiceStatus; if(!s) return;
                  dispatch(changeInvoiceStatus({ id: inv._id, status: s }));
                  e.currentTarget.value = "";
                }}
              >
                <option value="">{t("change","Change")}</option>
                {["draft","issued","sent","partially_paid","paid","canceled"].map(s=><option key={s} value={s}>{t(`status_${s}`, s)}</option>)}
              </Select>
              <Danger onClick={()=>dispatch(deleteInvoice(inv._id))}>{t("delete","Delete")}</Danger>
            </Buttons>
          </Card>
        ))}
      </CardList>
    </Wrap>
  );
}

/* ---- styled ---- */
const Wrap = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;

const Toolbar = styled.div`
  display:flex;align-items:flex-start;justify-content:space-between;gap:${({theme})=>theme.spacings.md};
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.md};
  ${({theme})=>theme.media.tablet}{flex-direction:column;}
`;
const FilterRow = styled.div`
  display:grid;gap:${({theme})=>theme.spacings.sm};
  grid-template-columns:repeat(5, minmax(160px, 1fr));
  ${({theme})=>theme.media.desktop}{grid-template-columns:repeat(4, minmax(160px, 1fr));}
  ${({theme})=>theme.media.tablet}{grid-template-columns:repeat(3, minmax(140px, 1fr));}
  ${({theme})=>theme.media.mobile}{grid-template-columns:1fr;}
`;

const Labeled = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};min-width:0;`;
const Label = styled.label`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;

const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};align-items:flex-end;flex-wrap:wrap;`;

const Input = styled.input`
  min-width:0;
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const Select = styled.select`
  min-width:0;
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;

const Btn = styled.button`
  padding:10px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;
const Secondary = styled(Btn)``;
const Danger = styled(Btn)`
  background:${({theme})=>theme.colors.dangerBg};
  color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger};
  &:hover{
    background:${({theme})=>theme.colors.dangerHover};
    color:${({theme})=>theme.colors.textOnDanger};
    border-color:${({theme})=>theme.colors.dangerHover};
  }
`;

const Table = styled.table`
  width:100%;border-collapse:collapse;
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;
  thead th{
    background:${({theme})=>theme.colors.tableHeader};
    color:${({theme})=>theme.colors.textSecondary};
    font-weight:${({theme})=>theme.fontWeights.semiBold};
    font-size:${({theme})=>theme.fontSizes.sm};
    padding:${({theme})=>theme.spacings.md};
    text-align:left;
  }
  td{
    padding:${({theme})=>theme.spacings.md};
    border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
    font-size:${({theme})=>theme.fontSizes.sm};
    vertical-align:middle;
  }
  td.mono{font-family:${({theme})=>theme.fonts.mono};}
  td.actions{text-align:right;}
  tbody tr:hover td{background:${({theme})=>theme.colors.hoverBackground};}
  ${({theme})=>theme.media.mobile}{display:none;}
`;

const Empty = styled.div`padding:${({theme})=>theme.spacings.md} 0;color:${({theme})=>theme.colors.textSecondary};text-align:center;`;
const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;`;

const Status = styled.span<{ $s: InvoiceStatus }>`
  display:inline-block;padding:.3em .9em;border-radius:${({theme})=>theme.radii.pill};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderHighlight};
  background:${({$s,theme})=>
    $s==="paid" ? theme.colors.successBg :
    $s==="sent" || $s==="issued" ? theme.colors.info ?? theme.colors.inputBackgroundLight :
    $s==="canceled" ? theme.colors.dangerBg :
    $s==="partially_paid" ? theme.colors.warningBackground :
    theme.colors.inputBackgroundLight};
  color:${({$s,theme})=>
    $s==="paid" ? theme.colors.success :
    $s==="sent" || $s==="issued" ? theme.colors.info ?? theme.colors.textSecondary :
    $s==="canceled" ? theme.colors.danger :
    $s==="partially_paid" ? theme.colors.warning :
    theme.colors.textSecondary};
`;

const CardList = styled.div`
  display:none;
  ${({theme})=>theme.media.mobile}{
    display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};
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
  display:flex;align-items:center;justify-content:space-between;
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md};
  background:${({theme})=>theme.colors.primaryLight};
  border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
`;
const Code = styled.span`font-weight:${({theme})=>theme.fontWeights.semiBold};`;
const CardBody = styled.div`padding:${({theme})=>theme.spacings.md};`;
const Line = styled.div`display:flex;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};padding:6px 0;`;
const Field = styled.span`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};min-width:120px;`;
const Value = styled.span`
  color:${({theme})=>theme.colors.text};
  font-size:${({theme})=>theme.fontSizes.xsmall};
  text-align:right;max-width:60%;word-break:break-word;
  &.mono{font-family:${({theme})=>theme.fonts.mono};}
`;
const Buttons = styled.div`
  display:flex;gap:${({theme})=>theme.spacings.xs};justify-content:flex-end;
  padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md} ${({theme})=>theme.spacings.md};
  border-top:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
`;
