// InvoiceForm.tsx
"use client";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/invoices";
import { useAppDispatch } from "@/store/hooks";
import { createInvoice, updateInvoice } from "@/modules/invoices/slice/invoicesSlice";
import type {
  IInvoice, IInvoiceItem, InvoiceType, InvoiceStatus, Discount
} from "@/modules/invoices/types";

function calcRow(it: IInvoiceItem) {
  const gross = (Number(it.quantity||0) * Number(it.unitPrice||0));
  const d = it.discount;
  const disc = !d ? 0 : d.type==="rate" ? Math.max(0, Math.min(100, Number(d.value||0)))*gross/100 : Math.max(0, Number(d.value||0));
  const sub = Math.max(0, gross - disc);
  const tax = Math.max(0, sub * ((Number(it.taxRate||0))/100));
  return { gross, disc, sub, tax, total: sub + tax };
}
function summarize(items: IInvoiceItem[], invDisc?: Discount, rounding?: number) {
  let itemsGross=0, itemsDisc=0, itemsSub=0, taxTotal=0;
  for (const it of items) {
    const c = calcRow(it);
    itemsGross += c.gross; itemsDisc += c.disc; itemsSub += c.sub; taxTotal += c.tax;
  }
  const invDiscVal = !invDisc ? 0 : invDisc.type==="rate" ? Math.max(0, Math.min(100, invDisc.value))*itemsSub/100 : Math.max(0, invDisc.value);
  const grand = Math.max(0, itemsSub - invDiscVal + taxTotal + (rounding||0));
  return {
    itemsSubtotal: +itemsGross.toFixed(2),
    itemsDiscountTotal: +itemsDisc.toFixed(2),
    invoiceDiscountTotal: +invDiscVal.toFixed(2),
    taxTotal: +taxTotal.toFixed(2),
    grandTotal: +grand.toFixed(2),
  };
}

interface Props {
  initial?: IInvoice;
  onClose: () => void;
  onSaved?: () => void;
}

export default function InvoiceForm({ initial, onClose, onSaved }: Props) {
  const { t, i18n } = useI18nNamespace("invoices", translations);
  const lang = (i18n.language?.slice(0,2) || "en") as string;
  const dispatch = useAppDispatch();
  const isEdit = Boolean(initial?._id);

  const [type, setType] = useState<InvoiceType>(initial?.type || "invoice");
  const [status, setStatus] = useState<InvoiceStatus>(initial?.status || "draft");
  const [issueDate, setIssueDate] = useState<string>(initial?.issueDate ? new Date(initial.issueDate).toISOString().slice(0,10) : "");
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0,10) : "");

  // parties
  const [seller, setSeller] = useState<IInvoice["seller"]>(initial?.seller || { name: "" });
  const [buyer, setBuyer] = useState<IInvoice["buyer"]>(initial?.buyer || { name: "" });

  // links (basit)
  const [customer, setCustomer] = useState<string>(initial?.links?.customer || "");
  const [apartment, setApartment] = useState<string>(initial?.links?.apartment || "");
  const [contract, setContract] = useState<string>(initial?.links?.contract || "");
  const [billingPlan, setBillingPlan] = useState<string>(initial?.links?.billingPlan || "");

  // items
  const [items, setItems] = useState<IInvoiceItem[]>(
    initial?.items?.length ? initial.items : [{ kind: "service", name: {}, quantity: 1, unitPrice: 0, taxRate: 0 }]
  );
  const upsertItem = (i: number, patch: Partial<IInvoiceItem>) =>
    setItems(arr => arr.map((it, idx) => idx===i ? { ...it, ...patch } : it));
  const addItem = () => setItems(arr => [...arr, { kind:"service", name:{}, quantity:1, unitPrice:0, taxRate:0 }]);
  const removeItem = (i: number) => setItems(arr => arr.filter((_,idx)=>idx!==i));

  // discount & totals
  const [invoiceDiscount, setInvoiceDiscount] = useState<Discount | undefined>(initial?.invoiceDiscount);
  const [currency, setCurrency] = useState<string>(initial?.totals?.currency || "EUR");
  const [fxRate, setFxRate] = useState<number>(Number(initial?.totals?.fxRate ?? 0));
  const [rounding, setRounding] = useState<number>(Number(initial?.totals?.rounding ?? 0));
  const [amountPaid, setAmountPaid] = useState<number>(Number(initial?.totals?.amountPaid ?? 0));

  const preview = useMemo(()=> summarize(items, invoiceDiscount, rounding), [items, invoiceDiscount, rounding]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<IInvoice> = {
      type, status,
      issueDate: issueDate || new Date().toISOString(),
      dueDate: dueDate || undefined,

      seller, buyer,
      links: {
        customer: customer || undefined,
        apartment: apartment || undefined,
        contract: contract || undefined,
        billingPlan: billingPlan || undefined,
      },

      items: items.map(it => ({ ...it })),
      invoiceDiscount: invoiceDiscount,

      totals: {
        currency,
        fxRate: fxRate || undefined,
        rounding: rounding || 0,
        amountPaid: amountPaid || 0,
        itemsSubtotal: preview.itemsSubtotal,
        itemsDiscountTotal: preview.itemsDiscountTotal,
        invoiceDiscountTotal: preview.invoiceDiscountTotal,
        taxTotal: preview.taxTotal,
        grandTotal: preview.grandTotal,
        balance: Math.max(0, preview.grandTotal - (amountPaid||0)),
      } as any,
    };

    if (isEdit && initial) {
      await dispatch(updateInvoice({ id: initial._id, changes: payload })).unwrap().catch(()=>{});
    } else {
      await dispatch(createInvoice(payload)).unwrap().catch(()=>{});
    }
    onSaved?.();
  };

  const tl = (obj?: Record<string,string>) => obj?.[lang] || obj?.en || "";

  return (
    <Form onSubmit={onSubmit}>
      <SectionTitle>{t("basics", "Basics")}</SectionTitle>
      <Row>
        <Labeled>
          <Label htmlFor="inv-type">{t("type","Type")}</Label>
          <Select id="inv-type" value={type} onChange={(e)=>setType(e.target.value as InvoiceType)}>
            {["invoice","creditNote"].map(x=><option key={x} value={x}>{t(`type_${x}`, x)}</option>)}
          </Select>
        </Labeled>
        <Labeled>
          <Label htmlFor="inv-status">{t("status","Status")}</Label>
          <Select id="inv-status" value={status} onChange={(e)=>setStatus(e.target.value as InvoiceStatus)}>
            {["draft","issued","sent","partially_paid","paid","canceled"].map(s=><option key={s} value={s}>{t(`status_${s}`, s)}</option>)}
          </Select>
        </Labeled>
        <Labeled>
          <Label htmlFor="inv-issue">{t("issueDate","Issue Date")}</Label>
          <Input id="inv-issue" type="date" required value={issueDate} onChange={(e)=>setIssueDate(e.target.value)} />
        </Labeled>
        <Labeled>
          <Label htmlFor="inv-due">{t("dueDate","Due Date")}</Label>
          <Input id="inv-due" type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
        </Labeled>
      </Row>

      <SectionTitle>{t("parties","Parties")}</SectionTitle>
      <Row>
        <Labeled><Label>{t("sellerName","Seller Name")}</Label><Input value={seller.name} onChange={(e)=>setSeller({ ...seller, name: e.target.value })} required /></Labeled>
        <Labeled><Label>{t("sellerTax","Seller TaxId")}</Label><Input value={seller.taxId||""} onChange={(e)=>setSeller({ ...seller, taxId: e.target.value || undefined })} /></Labeled>
        <Labeled><Label>{t("sellerEmail","Seller Email")}</Label><Input value={seller.email||""} onChange={(e)=>setSeller({ ...seller, email: e.target.value || undefined })} /></Labeled>
        <Labeled><Label>{t("sellerPhone","Seller Phone")}</Label><Input value={seller.phone||""} onChange={(e)=>setSeller({ ...seller, phone: e.target.value || undefined })} /></Labeled>
      </Row>
      <Row>
        <Labeled><Label>{t("buyerName","Buyer Name")}</Label><Input value={buyer.name} onChange={(e)=>setBuyer({ ...buyer, name: e.target.value })} required /></Labeled>
        <Labeled><Label>{t("buyerTax","Buyer TaxId")}</Label><Input value={buyer.taxId||""} onChange={(e)=>setBuyer({ ...buyer, taxId: e.target.value || undefined })} /></Labeled>
        <Labeled><Label>{t("buyerEmail","Buyer Email")}</Label><Input value={buyer.email||""} onChange={(e)=>setBuyer({ ...buyer, email: e.target.value || undefined })} /></Labeled>
        <Labeled><Label>{t("buyerPhone","Buyer Phone")}</Label><Input value={buyer.phone||""} onChange={(e)=>setBuyer({ ...buyer, phone: e.target.value || undefined })} /></Labeled>
      </Row>

      <SectionTitle>{t("links","Links")}</SectionTitle>
      <Row>
        <Labeled><Label>{t("customerId","Customer ID")}</Label><Input value={customer} onChange={(e)=>setCustomer(e.target.value)} /></Labeled>
        <Labeled><Label>{t("apartmentId","Apartment ID")}</Label><Input value={apartment} onChange={(e)=>setApartment(e.target.value)} /></Labeled>
        <Labeled><Label>{t("contractId","Contract ID")}</Label><Input value={contract} onChange={(e)=>setContract(e.target.value)} /></Labeled>
        <Labeled><Label>{t("billingPlanId","Billing Plan ID")}</Label><Input value={billingPlan} onChange={(e)=>setBillingPlan(e.target.value)} /></Labeled>
      </Row>

      <SectionTitle>{t("items","Items")}</SectionTitle>
      {items.map((it, idx)=>(
        <ItemRow key={idx} aria-label={t("item","Item") + " #" + (idx+1)}>
          <SmallCols>
            <Labeled>
              <Label>{t("kind","Kind")}</Label>
              <Select value={it.kind} onChange={(e)=>upsertItem(idx,{ kind: e.target.value as any })}>
                {["service","fee","product","custom"].map(k=><option key={k} value={k}>{t(`kind_${k}`, k)}</option>)}
              </Select>
            </Labeled>
            <Labeled>
              <Label>{t("quantity","Qty")}</Label>
              <Input type="number" min={0} step="0.01" value={it.quantity}
                onChange={(e)=>upsertItem(idx,{ quantity: Number(e.target.value)||0 })}/>
            </Labeled>
            <Labeled>
              <Label>{t("unit","Unit")}</Label>
              <Input value={it.unit || ""} onChange={(e)=>upsertItem(idx,{ unit: e.target.value || undefined })}/>
            </Labeled>
            <Labeled>
              <Label>{t("unitPrice","Unit Price")}</Label>
              <Input type="number" min={0} step="0.01" value={it.unitPrice}
                onChange={(e)=>upsertItem(idx,{ unitPrice: Number(e.target.value)||0 })}/>
            </Labeled>
            <Labeled>
              <Label>{t("taxRate","Tax %")}</Label>
              <Input type="number" min={0} max={100} step="0.01" value={it.taxRate ?? 0}
                onChange={(e)=>upsertItem(idx,{ taxRate: Number(e.target.value)||0 })}/>
            </Labeled>
          </SmallCols>

          <Labeled>
            <Label>{t("name","Name")} ({String(lang)})</Label>
            <Input value={tl(it.name)} onChange={(e)=>upsertItem(idx,{ name: { ...(it.name||{}), [lang]: e.target.value } })}/>
          </Labeled>
          <Labeled>
            <Label>{t("description","Description")} ({String(lang)})</Label>
            <TextArea rows={2} value={tl(it.description)} onChange={(e)=>upsertItem(idx,{ description: { ...(it.description||{}), [lang]: e.target.value } })}/>
          </Labeled>

          <DiscountRow>
            <Label>{t("rowDiscount","Row Discount")}</Label>
            <Select
              value={it.discount?.type || ""}
              onChange={(e)=>{
                const tp = e.target.value as ""|"rate"|"amount";
                if (!tp) return upsertItem(idx,{ discount: undefined });
                upsertItem(idx,{ discount: { type: tp, value: it.discount?.value ?? 0 }});
              }}
            >
              <option value="">{t("none","None")}</option>
              <option value="rate">% {t("rate","rate")}</option>
              <option value="amount">{t("amount","Amount")}</option>
            </Select>
            {it.discount && (
              <Input type="number" step="0.01" min={0} max={it.discount.type==="rate"?100:undefined}
                value={it.discount.value}
                onChange={(e)=>upsertItem(idx,{ discount: { type: it.discount!.type, value: Number(e.target.value)||0 }})}/>
            )}
          </DiscountRow>

          <TotalsLine>
            {(() => { const c = calcRow(it);
              return <span>{t("lineTotal","Total")}: <b>{c.total.toFixed(2)} {currency}</b> — {t("net","Net")}: {c.sub.toFixed(2)} / {t("tax","Tax")}: {c.tax.toFixed(2)}</span>;
            })()}
          </TotalsLine>

          <BtnRow>
            <Small onClick={(ev)=>{ev.preventDefault(); addItem();}}>{t("add","Add")}</Small>
            {items.length>1 && <Small onClick={(ev)=>{ev.preventDefault(); removeItem(idx);}}>{t("remove","Remove")}</Small>}
          </BtnRow>
        </ItemRow>
      ))}

      <SectionTitle>{t("totals","Totals")}</SectionTitle>
      <Row>
        <Labeled><Label>{t("currency","Currency")}</Label><Input value={currency} onChange={(e)=>setCurrency(e.target.value)} /></Labeled>
        <Labeled><Label>{t("fxRate","FX Rate")}</Label><Input type="number" step="0.0001" value={fxRate} onChange={(e)=>setFxRate(Number(e.target.value))} /></Labeled>
        <Labeled><Label>{t("rounding","Rounding")}</Label><Input type="number" step="0.01" value={rounding} onChange={(e)=>setRounding(Number(e.target.value))} /></Labeled>
        <Labeled><Label>{t("amountPaid","Amount Paid")}</Label><Input type="number" step="0.01" min={0} value={amountPaid} onChange={(e)=>setAmountPaid(Number(e.target.value))} /></Labeled>
      </Row>

      <Row>
        <Labeled $span2>
          <Label>{t("invoiceDiscount","Invoice Discount")}</Label>
          <DiscountRow>
            <Select
              value={invoiceDiscount?.type || ""}
              onChange={(e)=>{
                const tp = e.target.value as ""|"rate"|"amount";
                if (!tp) return setInvoiceDiscount(undefined);
                setInvoiceDiscount({ type: tp, value: invoiceDiscount?.value ?? 0 });
              }}
            >
              <option value="">{t("none","None")}</option>
              <option value="rate">% {t("rate","rate")}</option>
              <option value="amount">{t("amount","Amount")}</option>
            </Select>
            {invoiceDiscount && (
              <Input type="number" step="0.01" min={0} max={invoiceDiscount.type==="rate"?100:undefined}
                value={invoiceDiscount.value}
                onChange={(e)=>setInvoiceDiscount({ type: invoiceDiscount.type, value: Number(e.target.value)||0 })}/>
            )}
          </DiscountRow>
        </Labeled>

        <Summary aria-live="polite">
          <span>{t("itemsSubtotal","Items Subtotal")}: <b>{preview.itemsSubtotal.toFixed(2)} {currency}</b></span>
          <span>{t("itemsDiscount","Items Discount")}: <b>{preview.itemsDiscountTotal.toFixed(2)} {currency}</b></span>
          <span>{t("invoiceDiscount","Invoice Discount")}: <b>{preview.invoiceDiscountTotal.toFixed(2)} {currency}</b></span>
          <span>{t("taxTotal","Tax Total")}: <b>{preview.taxTotal.toFixed(2)} {currency}</b></span>
          <span>{t("grandTotal","Grand Total")}: <b>{preview.grandTotal.toFixed(2)} {currency}</b></span>
        </Summary>
      </Row>

      <Actions>
        <Secondary type="button" onClick={onClose}>{t("cancel","Cancel")}</Secondary>
        <Primary type="submit">{isEdit ? t("update","Update") : t("create","Create")}</Primary>
      </Actions>
    </Form>
  );
}

/* ---- styled ---- */
const Form = styled.form`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.lg};`;
const SectionTitle = styled.h3`margin:0;color:${({theme})=>theme.colors.textPrimary};font-size:${({theme})=>theme.fontSizes.md};`;

const Row = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:${({theme})=>theme.spacings.md};
  ${({theme})=>theme.media.tablet}{grid-template-columns:repeat(2,1fr);}
  ${({theme})=>theme.media.mobile}{grid-template-columns:1fr;}
`;
const ItemRow = styled.div`
  display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};
  padding:${({theme})=>theme.spacings.sm} 0;border-top:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
`;
const SmallCols = styled.div`
  display:grid;gap:${({theme})=>theme.spacings.xs};grid-template-columns:repeat(5,1fr);
  ${({theme})=>theme.media.mobile}{grid-template-columns:repeat(2,1fr);}
`;

const Labeled = styled.div<{ $span2?: boolean }>`
  display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};min-width:0;
  ${({$span2})=>$span2?`grid-column: span 2;`:``}
`;
const Label = styled.label`
  font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};
`;

const Input = styled.input`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  min-width:0;
`;
const TextArea = styled.textarea`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const Select = styled.select`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  min-width:0;
`;
const DiscountRow = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;flex-wrap:wrap;`;
const TotalsLine = styled.div`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};`;
const Summary = styled.div`
  display:flex;flex-direction:column;gap:6px;justify-content:center;
  padding:${({theme})=>theme.spacings.sm};border-radius:${({theme})=>theme.radii.md};
  background:${({theme})=>theme.colors.backgroundAlt};
`;

const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};justify-content:flex-end;`;
const Primary = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  &:hover{background:${({theme})=>theme.buttons.primary.backgroundHover};}
`;
const Secondary = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;

const Small = styled.button`
  background:${({theme})=>theme.colors.backgroundAlt};
  color:${({theme})=>theme.colors.textPrimary};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  font-size:${({theme})=>theme.fontSizes.xsmall};
  &:hover{background:${({theme})=>theme.colors.background};}
`;

const BtnRow = styled.div`
  display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;justify-content:flex-end;
  margin-top:${({theme})=>theme.spacings.sm};
`;
