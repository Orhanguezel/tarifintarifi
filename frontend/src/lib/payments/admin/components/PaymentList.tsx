// src/modules/payments/ui/PaymentList.tsx
"use client";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/payments";
import { changePaymentStatus, deletePayment, fetchPaymentsAdmin } from "@/modules/payments/slice/paymentsSlice";
import type { IPayment, PaymentsAdminFilters, PaymentStatus } from "@/modules/payments/types";

const STATUSES: PaymentStatus[] = ["pending","confirmed","partially_allocated","allocated","failed","canceled"];

type Props = { items: IPayment[]; loading?: boolean; onEdit: (p: IPayment) => void; };

export default function PaymentList({ items, loading, onEdit }: Props) {
  const { t, i18n } = useI18nNamespace("payments", translations);
  const dispatch = useAppDispatch();

  const [f, setF] = useState<PaymentsAdminFilters>({ limit: 200 });
  const onChange = (k: keyof PaymentsAdminFilters, v: unknown) =>
    setF(s => ({ ...s, [k]: (v===undefined || v===null || v==="") ? undefined : v as any }));
  const applied = useMemo(() => f, [f]);

  const currencyFmt = (n?: number, c?: string) => {
    if (n===undefined || n===null) return "–";
    try { return new Intl.NumberFormat(i18n.language, { style:"currency", currency: c || "EUR" }).format(n); }
    catch { return `${n.toFixed(2)} ${c ?? ""}`.trim(); }
  };
  const dateFmt = (d: unknown) =>
    d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(d as any)) : "–";

  const confirmDelete = (p: IPayment) => {
    if (window.confirm(t("list.confirmDelete","Delete payment {{code}}?", { code: p.code }))) {
      dispatch(deletePayment(p._id));
    }
  };

  return (
    <Wrap>
      <Toolbar role="region" aria-label={t("list.filters","Filters")}>
        <Filters>
          <Input placeholder={t("list.searchPh","Search (code/ref/payer)")} value={f.q || ""} onChange={(e)=>onChange("q", e.target.value)} />
          <Select value={f.status || ""} onChange={(e)=>onChange("status", e.target.value || undefined)} aria-label={t("status","Status")}>
            <option value="">{t("status","Status")}</option>
            {STATUSES.map(s=><option key={s} value={s}>{t(`status.${s}`, s)}</option>)}
          </Select>
          <Select value={f.kind || ""} onChange={(e)=>onChange("kind", e.target.value || undefined)} aria-label={t("kind","Kind")}>
            <option value="">{t("kind","Kind")}</option>
            <option value="payment">{t("kind.payment","payment")}</option>
            <option value="refund">{t("kind.refund","refund")}</option>
            <option value="chargeback">{t("kind.chargeback","chargeback")}</option>
          </Select>
          <Select value={f.method || ""} onChange={(e)=>onChange("method", e.target.value || undefined)} aria-label={t("method","Method")}>
            <option value="">{t("method","Method")}</option>
            <option value="cash">{t("method.cash","cash")}</option>
            <option value="bank_transfer">{t("method.bank_transfer","bank_transfer")}</option>
            <option value="sepa">{t("method.sepa","sepa")}</option>
            <option value="ach">{t("method.ach","ach")}</option>
            <option value="card">{t("method.card","card")}</option>
            <option value="wallet">{t("method.wallet","wallet")}</option>
            <option value="check">{t("method.check","check")}</option>
            <option value="other">{t("method.other","other")}</option>
          </Select>
          <Input placeholder={t("list.provider","Provider")} value={f.provider || ""} onChange={(e)=>onChange("provider", e.target.value)} />
          <Input placeholder={t("list.customerId","CustomerId")} value={f.customer || ""} onChange={(e)=>onChange("customer", e.target.value)} />
          <Input placeholder={t("list.apartmentId","ApartmentId")} value={f.apartment || ""} onChange={(e)=>onChange("apartment", e.target.value)} />
          <Input placeholder={t("list.contractId","ContractId")} value={f.contract || ""} onChange={(e)=>onChange("contract", e.target.value)} />
          <Input placeholder={t("list.invoiceId","InvoiceId")} value={f.invoice || ""} onChange={(e)=>onChange("invoice", e.target.value)} />
          <Select value={f.reconciled===undefined? "" : String(f.reconciled)} onChange={(e)=>onChange("reconciled", e.target.value===""? undefined : e.target.value==="true")} aria-label={t("reconciled","Reconciled?")}>
            <option value="">{t("common.all","All")}</option>
            <option value="true">{t("common.yes","Yes")}</option>
            <option value="false">{t("common.no","No")}</option>
          </Select>
          <Input type="date" value={f.receivedFrom || ""} onChange={(e)=>onChange("receivedFrom", e.target.value)} aria-label={t("list.receivedFrom","Received from")} />
          <Input type="date" value={f.receivedTo || ""} onChange={(e)=>onChange("receivedTo", e.target.value)} aria-label={t("list.receivedTo","Received to")} />
          <Input type="number" step="0.01" placeholder={t("list.min","Min")} value={f.amountMin ?? ""} onChange={(e)=>onChange("amountMin", e.target.value===""? undefined : Number(e.target.value))} />
          <Input type="number" step="0.01" placeholder={t("list.max","Max")} value={f.amountMax ?? ""} onChange={(e)=>onChange("amountMax", e.target.value===""? undefined : Number(e.target.value))} />
          <Input type="number" min={1} max={500} value={f.limit ?? 200} onChange={(e)=>onChange("limit", Number(e.target.value)||200)} aria-label={t("list.limit","Limit")} />
        </Filters>
        <Actions>
          <Btn onClick={()=>dispatch(fetchPaymentsAdmin(applied))} disabled={loading}>{t("actions.apply","Apply")}</Btn>
          <Btn onClick={()=>{ setF({ limit: 200 }); dispatch(fetchPaymentsAdmin(undefined)); }} disabled={loading}>{t("actions.reset","Reset")}</Btn>
        </Actions>
      </Toolbar>

      {/* Desktop / wide screens: scrollable table */}
      <TableScroller>
        <Table role="table" aria-label={t("list.table","Payments")}>
          <thead>
            <tr>
              <th>{t("list.th.date","Date")}</th>
              <th>{t("list.th.code","Code")}</th>
              <th>{t("list.th.kindMethod","Kind/Method")}</th>
              <th>{t("list.th.gross","Gross")}</th>
              <th>{t("list.th.fee","Fee")}</th>
              <th>{t("list.th.net","Net")}</th>
              <th>{t("list.th.allocated","Allocated")}</th>
              <th>{t("list.th.unapplied","Unapplied")}</th>
              <th>{t("list.th.status","Status")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(!loading && items.length===0) && <tr><td colSpan={10}><Empty>∅ {t("common.noResults","No results")}</Empty></td></tr>}
            {items.map(p=>(
              <tr key={p._id}>
                <td>{dateFmt(p.receivedAt)}</td>
                <td className="mono">{p.code}</td>
                <td>{t(`kind.${p.kind}`, p.kind)} / {t(`method.${p.method}`, p.method)}</td>
                <td>{currencyFmt(p.grossAmount, p.currency)}</td>
                <td>{currencyFmt(p.feeTotal, p.currency)}</td>
                <td>{currencyFmt(p.netAmount, p.currency)}</td>
                <td>{currencyFmt(p.allocatedTotal, p.currency)}</td>
                <td>{currencyFmt(p.unappliedAmount, p.currency)}</td>
                <td>
                  {/* small -> $small (transient prop) */}
                  <Select $small defaultValue={p.status} onChange={(e)=>dispatch(changePaymentStatus({ id: p._id, status: e.target.value as PaymentStatus }))}>
                    {STATUSES.map(s=><option key={s} value={s}>{t(`status.${s}`, s)}</option>)}
                  </Select>
                </td>
                <td className="actions">
                  <Row>
                    <Secondary onClick={()=>onEdit(p)}>{t("actions.edit","Edit")}</Secondary>
                    <Danger onClick={()=>confirmDelete(p)}>{t("actions.delete","Delete")}</Danger>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroller>

      {/* Tablet & Mobile cards */}
      <CardList role="list" aria-label={t("list.table","Payments")}>
        {items.length===0 && !loading && <Empty>∅ {t("common.noResults","No results")}</Empty>}
        {items.map(p=>(
          <Card key={p._id} role="listitem">
            <Line><Field>{t("list.th.date","Date")}</Field><Value>{dateFmt(p.receivedAt)}</Value></Line>
            <Line><Field>{t("list.th.code","Code")}</Field><Value className="mono">{p.code}</Value></Line>
            <Line><Field>{t("list.th.amount","Amount")}</Field><Value>{currencyFmt(p.netAmount ?? p.grossAmount, p.currency)}</Value></Line>
            <Line><Field>{t("list.th.status","Status")}</Field><Value>{t(`status.${p.status}`, p.status)}</Value></Line>
            <Buttons>
              <Secondary onClick={()=>onEdit(p)}>{t("actions.edit","Edit")}</Secondary>
              <Danger onClick={()=>confirmDelete(p)}>{t("actions.delete","Delete")}</Danger>
            </Buttons>
          </Card>
        ))}
      </CardList>
    </Wrap>
  );
}

/* styled */
const Wrap = styled.div`
  display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};
  max-width:100%;
`;

/* filter bar */
const Toolbar = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  border-radius:${({theme})=>theme.radii.lg};box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.md};
  ${({theme})=>theme.media.tablet}{flex-direction:column;align-items:stretch;}
`;
const Filters = styled.div`
  display:grid;gap:${({theme})=>theme.spacings.sm};
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
`;
const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};`;
const Input = styled.input`
  min-width:0;padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;

/* scroll wrapper for table */
const TableScroller = styled.div`
  width:100%;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  background:${({theme})=>theme.colors.cardBackground};
  /* hide scrollbar gutter on iOS */
  scrollbar-width: thin;
`;

/* transient prop: $small */
const Select = styled.select<{ $small?: boolean }>`
  min-width:0;
  padding:${({$small})=>$small?"6px 8px":"10px 12px"};
  border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;

/* table itself */
const Table = styled.table`
  width:100%;
  min-width:980px; /* geniş ekran için sabit minimum, scroller devreye girer */
  border-collapse:separate; border-spacing:0;
  background:${({theme})=>theme.colors.cardBackground};

  thead th{
    position:sticky; top:0; z-index:1; /* scroll içinde başlıklar sabit kalsın */
    background:${({theme})=>theme.colors.tableHeader};
    color:${({theme})=>theme.colors.textSecondary};
    font-weight:${({theme})=>theme.fontWeights.semiBold};
    font-size:${({theme})=>theme.fontSizes.sm};
    padding:${({theme})=>theme.spacings.md};
    text-align:left;
    white-space:nowrap;
  }
  td{
    padding:${({theme})=>theme.spacings.md};
    border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
    font-size:${({theme})=>theme.fontSizes.sm};
    vertical-align:middle;
    word-break:normal;
  }
  td.mono{font-family:${({theme})=>theme.fonts.mono}; word-break:break-all;}
  td.actions{text-align:right; white-space:nowrap;}

  tr:hover td{background:${({theme})=>theme.colors.hoverBackground};}

  /* tablet ve aşağısında tabloyu gizle, kartları göster */
  ${({theme})=>theme.media.tablet}{display:none;}
`;

/* buttons */
const Btn = styled.button`
  padding:10px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.colors.buttonBackground};color:${({theme})=>theme.colors.buttonText};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.buttonBorder};
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;
const Secondary = styled(Btn)`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border-color:${({theme})=>theme.colors.border};
`;
const Danger = styled(Btn)`
  background:${({theme})=>theme.colors.dangerBg};
  color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger};
`;

const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;`;
const Empty = styled.div`padding:${({theme})=>theme.spacings.md} 0;color:${({theme})=>theme.colors.textSecondary};text-align:center;`;

/* cards for tablet & mobile */
const CardList = styled.div`
  display:none;
  ${({theme})=>theme.media.tablet}{display:flex;}
  flex-direction:column;gap:${({theme})=>theme.spacings.md};
`;
const Card = styled.div`
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.md};
`;
const Line = styled.div`display:flex;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};padding:6px 0;`;
const Field = styled.span`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};min-width:110px;`;
const Value = styled.span`
  color:${({theme})=>theme.colors.text};
  font-size:${({theme})=>theme.fontSizes.xsmall};
  text-align:right;max-width:60%;
  word-break:break-word;
  &.mono{font-family:${({theme})=>theme.fonts.mono};}
`;
const Buttons = styled.div`display:flex;justify-content:flex-end;gap:${({theme})=>theme.spacings.xs};margin-top:${({theme})=>theme.spacings.sm};`;
