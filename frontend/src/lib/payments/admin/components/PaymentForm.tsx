// src/modules/payments/ui/PaymentForm.tsx
"use client";
import { useState, useMemo } from "react";
import styled, { css } from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/payments";
import { useAppDispatch } from "@/store/hooks";
import { createPayment, updatePayment } from "@/modules/payments/slice/paymentsSlice";
import type {
  IPayment, IPaymentFee,
  PaymentKind, PaymentMethod, PaymentStatus
} from "@/modules/payments/types";

const METHODS: PaymentMethod[] = ["cash","bank_transfer","sepa","ach","card","wallet","check","other"];
const KINDS: PaymentKind[] = ["payment","refund","chargeback"];
const STATUSES: PaymentStatus[] = ["pending","confirmed","partially_allocated","allocated","failed","canceled"];

/* ----- helpers ----- */
const idOf = (v: unknown): string =>
  typeof v === "string" ? v : (v && typeof v === "object" && (v as any)._id) ? String((v as any)._id) : "";

const toYMD = (d?: unknown): string => {
  if (!d) return "";
  const dt = new Date(d as any);
  return isNaN(+dt) ? "" : dt.toISOString().slice(0, 10);
};

/* local state tipleri: sadece UI için (string id + YMD string) */
type LinksState = { customer: string; apartment: string; contract: string };
type AllocState = { invoice: string; invoiceCode?: string; amount: number; appliedAt?: string; note?: string };

type Props = { initial?: IPayment; onClose: () => void; onSaved?: () => void; };

export default function PaymentForm({ initial, onClose, onSaved }: Props) {
  const { t, i18n } = useI18nNamespace("payments", translations);
  const dispatch = useAppDispatch();
  const isEdit = !!initial?._id;

  const [code, setCode] = useState(initial?.code ?? "");
  const [kind, setKind] = useState<PaymentKind>(initial?.kind ?? "payment");
  const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? "pending");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "cash");
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [providerRef, setProviderRef] = useState(initial?.providerRef ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");

  const [grossAmount, setGrossAmount] = useState<number>(Number(initial?.grossAmount ?? 0));
  const [currency, setCurrency] = useState(initial?.currency ?? "EUR");
  const [fxRate, setFxRate] = useState<number | "">(initial?.fxRate ?? "");
  const [fees, setFees] = useState<IPaymentFee[]>(initial?.fees ?? []);

  const [receivedAt, setReceivedAt] = useState(
    initial?.receivedAt ? toYMD(initial.receivedAt) : toYMD(new Date())
  );
  const [bookedAt, setBookedAt] = useState(initial?.bookedAt ? toYMD(initial.bookedAt) : "");

  const [payer, setPayer] = useState(initial?.payer || {});
  const [instrument, setInstrument] = useState(initial?.instrument || {});

  // links’i her durumda string id’ye indir
  const [links, setLinks] = useState<LinksState>({
    customer: idOf(initial?.links && (initial.links as any).customer),
    apartment: idOf(initial?.links && (initial.links as any).apartment),
    contract: idOf(initial?.links && (initial.links as any).contract),
  });

  // allocations’ı string id + YMD string’e indir
  const [allocations, setAllocations] = useState<AllocState[]>(
    (initial?.allocations as any[] | undefined)?.map((a) => ({
      invoice: idOf(a?.invoice),
      invoiceCode: a?.invoiceCode,
      amount: Number(a?.amount || 0),
      appliedAt: a?.appliedAt ? toYMD(a.appliedAt) : undefined,
      note: a?.note,
    })) ?? []
  );

  const [metadataRaw, setMetadataRaw] = useState(initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : "");
  const [reconciled, setReconciled] = useState<boolean>(!!initial?.reconciled);
  const [statementRef, setStatementRef] = useState(initial?.statementRef || "");

  const addFee = () => setFees((s) => [...s, { type: "manual", amount: 0, currency } as IPaymentFee]);
  const updateFee = (i: number, patch: Partial<IPaymentFee>) => setFees(s => s.map((f, idx) => idx===i ? { ...f, ...patch } : f));
  const removeFee = (i: number) => setFees(s => s.filter((_, idx) => idx !== i));

  const addAlloc = () => setAllocations(s => [...s, { invoice: "", amount: 0 }]);
  const updateAlloc = (i: number, patch: Partial<AllocState>) => setAllocations(s => s.map((a, idx) => idx===i ? { ...a, ...patch } : a));
  const removeAlloc = (i: number) => setAllocations(s => s.filter((_, idx) => idx !== i));

  const fmtCurr = useMemo(() => {
    try {
      return (n?: number, c?: string) =>
        n == null ? "" : new Intl.NumberFormat(i18n.language, { style: "currency", currency: (c || "EUR") as any }).format(n);
    } catch {
      return (n?: number, c?: string) => (n == null ? "" : `${n.toFixed(2)} ${c || ""}`.trim());
    }
  }, [i18n.language]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<IPayment> = {
      code: code || undefined,
      kind, status, method,
      provider: provider || undefined,
      providerRef: providerRef || undefined,
      reference: reference || undefined,

      grossAmount: Number(grossAmount) || 0,
      currency: (currency || "EUR").toUpperCase(),
      fxRate: fxRate === "" ? undefined : Number(fxRate),

      fees: (fees || []).map(f => ({
        ...f,
        amount: Number(f.amount) || 0,
        currency: (f.currency || currency).toUpperCase(),
      })),

      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
      bookedAt: bookedAt ? new Date(bookedAt).toISOString() : undefined,

      payer,
      instrument,
      links: {
        customer: links.customer || undefined,
        apartment: links.apartment || undefined,
        contract: links.contract || undefined,
      },

      allocations: (allocations || [])
        .filter(a => a.invoice && Number(a.amount) > 0)
        .map(a => ({
          invoice: a.invoice,
          amount: Number(a.amount),
          note: a.note,
          appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString() : undefined,
        })),

      metadata: (() => { try { return metadataRaw ? JSON.parse(metadataRaw) : undefined; } catch { return undefined; } })(),
      reconciled,
      statementRef: statementRef || undefined,
    };

    try {
      if (isEdit) {
        await dispatch(updatePayment({ id: initial!._id, changes: payload })).unwrap();
      } else {
        await dispatch(createPayment(payload)).unwrap();
      }
      onSaved?.();
    } catch {
      /* slice toast'ları zaten var */
    }
  };

  return (
    <Form onSubmit={submit} aria-describedby="pay-form-desc">
      <SrOnly id="pay-form-desc">{t("form.regionLabel","Create or edit payment")}</SrOnly>

      <Row>
        <Col>
          <Label htmlFor="pf-code">{t("form.code","Code")}</Label>
          <Input id="pf-code" value={code} onChange={(e)=>setCode(e.target.value)} placeholder={t("form.codePh","(auto if empty)")} />
        </Col>
        <Col>
          <Label htmlFor="pf-kind">{t("form.kind","Kind")}</Label>
          <Select id="pf-kind" value={kind} onChange={(e)=>setKind(e.target.value as PaymentKind)}>
            {KINDS.map(k=><option key={k} value={k}>{t(`kind.${k}`, k)}</option>)}
          </Select>
        </Col>
        <Col>
          <Label htmlFor="pf-status">{t("form.status","Status")}</Label>
          <Select id="pf-status" value={status} onChange={(e)=>setStatus(e.target.value as PaymentStatus)}>
            {STATUSES.map(s=><option key={s} value={s}>{t(`status.${s}`, s)}</option>)}
          </Select>
        </Col>
        <Col>
          <Label htmlFor="pf-method">{t("form.method","Method")}</Label>
          <Select id="pf-method" value={method} onChange={(e)=>setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map(m=><option key={m} value={m}>{t(`method.${m}`, m)}</option>)}
          </Select>
        </Col>
      </Row>

      <Row>
        <Col><Label htmlFor="pf-prov">{t("form.provider","Provider")}</Label><Input id="pf-prov" value={provider} onChange={(e)=>setProvider(e.target.value)} /></Col>
        <Col><Label htmlFor="pf-provref">{t("form.providerRef","Provider Ref")}</Label><Input id="pf-provref" value={providerRef} onChange={(e)=>setProviderRef(e.target.value)} /></Col>
        <Col><Label htmlFor="pf-ref">{t("form.reference","Reference")}</Label><Input id="pf-ref" value={reference} onChange={(e)=>setReference(e.target.value)} /></Col>
        <Col><Label htmlFor="pf-curr">{t("form.currency","Currency")}</Label><Input id="pf-curr" value={currency} onChange={(e)=>setCurrency(e.target.value.toUpperCase())} /></Col>
      </Row>

      <Row>
        <Col><Label htmlFor="pf-gross">{t("form.grossAmount","Gross Amount")}</Label><Input id="pf-gross" type="number" min={0} step="0.01" value={grossAmount} onChange={(e)=>setGrossAmount(Number(e.target.value)||0)} /></Col>
        <Col><Label htmlFor="pf-fx">{t("form.fxRate","FX Rate")}</Label><Input id="pf-fx" type="number" min={0} step="0.0001" value={fxRate} onChange={(e)=>setFxRate(e.target.value===""? "": Number(e.target.value))} /></Col>
        <Col><Label htmlFor="pf-rec">{t("form.receivedAt","Received At")}</Label><Input id="pf-rec" type="date" value={receivedAt} onChange={(e)=>setReceivedAt(e.target.value)} /></Col>
        <Col><Label htmlFor="pf-book">{t("form.bookedAt","Booked At")}</Label><Input id="pf-book" type="date" value={bookedAt} onChange={(e)=>setBookedAt(e.target.value)} /></Col>
      </Row>

      <Block>{t("form.payer","Payer")}</Block>
      <Row>
        <Col><Label>{t("payer.name","Name")}</Label><Input value={String(payer.name||"")} onChange={(e)=>setPayer({...payer, name:e.target.value})} /></Col>
        <Col><Label>{t("payer.email","Email")}</Label><Input value={String(payer.email||"")} onChange={(e)=>setPayer({...payer, email:e.target.value})} /></Col>
        <Col><Label>{t("payer.phone","Phone")}</Label><Input value={String(payer.phone||"")} onChange={(e)=>setPayer({...payer, phone:e.target.value})} /></Col>
        <Col><Label>{t("payer.taxId","Tax ID")}</Label><Input value={String(payer.taxId||"")} onChange={(e)=>setPayer({...payer, taxId:e.target.value})} /></Col>
      </Row>
      <Row>
        <Col style={{gridColumn:"span 4"}}><Label>{t("payer.address","Address")}</Label><Input value={String(payer.addressLine||"")} onChange={(e)=>setPayer({...payer, addressLine:e.target.value})} /></Col>
      </Row>

      <Block>{t("form.instrument","Instrument")}</Block>
      <Row>
        <Col><Label>{t("instrument.type","Type")}</Label>
          <Select value={String((instrument as any).type || "")} onChange={(e)=>setInstrument({...instrument, type: e.target.value as any})}>
            <option value="">{t("common.none","-")}</option>
            <option value="card">{t("instrument.card","card")}</option>
            <option value="bank">{t("instrument.bank","bank")}</option>
            <option value="cash">{t("instrument.cash","cash")}</option>
            <option value="wallet">{t("instrument.wallet","wallet")}</option>
            <option value="other">{t("instrument.other","other")}</option>
          </Select>
        </Col>
        <Col><Label>{t("instrument.brand","Brand")}</Label><Input value={String((instrument as any).brand||"")} onChange={(e)=>setInstrument({...instrument, brand:e.target.value})} /></Col>
        <Col><Label>{t("instrument.last4","Last4")}</Label><Input value={String((instrument as any).last4||"")} onChange={(e)=>setInstrument({...instrument, last4:e.target.value})} /></Col>
        <Col><Label>{t("instrument.iban","IBAN")}</Label><Input value={String((instrument as any).iban||"")} onChange={(e)=>setInstrument({...instrument, iban:e.target.value})} /></Col>
      </Row>

      <Block>{t("form.links","Links")}</Block>
      <Row>
        <Col><Label>{t("links.customer","Customer ID")}</Label><Input value={links.customer} onChange={(e)=>setLinks({...links, customer:e.target.value})} /></Col>
        <Col><Label>{t("links.apartment","Apartment ID")}</Label><Input value={links.apartment} onChange={(e)=>setLinks({...links, apartment:e.target.value})} /></Col>
        <Col><Label>{t("links.contract","Contract ID")}</Label><Input value={links.contract} onChange={(e)=>setLinks({...links, contract:e.target.value})} /></Col>
      </Row>

      <Block>{t("form.fees","Fees")}</Block>
      {fees.map((f, i)=>(
        <Row key={i}>
          <Col>
            <Label>{t("fees.type","Type")}</Label>
            <Select value={f.type} onChange={(e)=>updateFee(i,{ type:e.target.value as any })}>
              <option value="gateway">{t("fees.gateway","gateway")}</option>
              <option value="bank">{t("fees.bank","bank")}</option>
              <option value="manual">{t("fees.manual","manual")}</option>
            </Select>
          </Col>
          <Col><Label>{t("fees.amount","Amount")}</Label><Input type="number" step="0.01" min={0} value={f.amount} onChange={(e)=>updateFee(i,{ amount:Number(e.target.value)||0 })} /></Col>
          <Col><Label>{t("fees.currency","Currency")}</Label><Input value={f.currency} onChange={(e)=>updateFee(i,{ currency:e.target.value.toUpperCase() })} /></Col>
          <Col style={{display:"flex",alignItems:"end"}}>
            {/* transient prop: $danger */}
            <Mini $danger onClick={(ev)=>{ev.preventDefault(); removeFee(i);}}>
              {t("actions.remove","Remove")}
            </Mini>
          </Col>
        </Row>
      ))}
      <BtnRow><Mini onClick={(e)=>{e.preventDefault(); addFee();}}>+ {t("fees.add","Add Fee")}</Mini><Hint>{fmtCurr(grossAmount, currency)}</Hint></BtnRow>

      <Block>{t("form.allocations","Allocations")}</Block>
      {allocations.map((a, i)=>(
        <Row key={i}>
          <Col><Label>{t("alloc.invoice","Invoice ID")}</Label><Input value={a.invoice} onChange={(e)=>updateAlloc(i,{ invoice:e.target.value })} /></Col>
          <Col><Label>{t("alloc.amount","Amount")}</Label><Input type="number" step="0.01" min={0} value={a.amount} onChange={(e)=>updateAlloc(i,{ amount:Number(e.target.value)||0 })} /></Col>
          <Col><Label>{t("alloc.appliedAt","Applied At")}</Label><Input type="date" value={a.appliedAt ?? ""} onChange={(e)=>updateAlloc(i,{ appliedAt: e.target.value || undefined })} /></Col>
          <Col style={{display:"flex",alignItems:"end"}}>
            {/* transient prop: $danger */}
            <Mini $danger onClick={(ev)=>{ev.preventDefault(); removeAlloc(i);}}>
              {t("actions.remove","Remove")}
            </Mini>
          </Col>
        </Row>
      ))}
      <BtnRow><Mini onClick={(e)=>{e.preventDefault(); addAlloc();}}>+ {t("alloc.add","Add Allocation")}</Mini></BtnRow>

      <Block>{t("form.other","Other")}</Block>
      <Row>
        <Col><Label>{t("form.reconciled","Reconciled")}</Label><Check><input type="checkbox" checked={reconciled} onChange={(e)=>setReconciled(e.target.checked)} /><span>{reconciled? t("common.yes","Yes") : t("common.no","No")}</span></Check></Col>
        <Col><Label>{t("form.statementRef","Statement Ref")}</Label><Input value={statementRef} onChange={(e)=>setStatementRef(e.target.value)} /></Col>
        <Col style={{gridColumn:"span 2"}}><Label>{t("form.metadata","Metadata (JSON)")}</Label><TextArea rows={3} value={metadataRaw} onChange={(e)=>setMetadataRaw(e.target.value)} /></Col>
      </Row>

      <Actions>
        <Secondary type="button" onClick={onClose}>{t("actions.cancel","Cancel")}</Secondary>
        <Primary type="submit">{isEdit ? t("actions.update","Update") : t("actions.create","Create")}</Primary>
      </Actions>
    </Form>
  );
}

/* styled */
const SrOnly = styled.span`
  position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);
`;
const focusable = css`
  transition: border-color ${({theme})=>theme.transition.fast}, box-shadow ${({theme})=>theme.transition.fast};
  &:focus{ outline:none; border-color:${({theme})=>theme.colors.inputBorderFocus}; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
  &:disabled{ opacity:${({theme})=>theme.opacity.disabled}; cursor:not-allowed; }
`;
const Form = styled.form`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;
const Row = styled.div`
  display:grid;gap:${({theme})=>theme.spacings.md};
  grid-template-columns:repeat(4,1fr);
  ${({theme})=>theme.media.tablet}{grid-template-columns:repeat(2,1fr);}
  ${({theme})=>theme.media.mobile}{grid-template-columns:1fr;}
`;
const Col = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.xs};`;
const Block = styled.h3`margin:${({theme})=>theme.spacings.sm} 0;`;
const Label = styled.label`font-size:${({theme})=>theme.fontSizes.xsmall};color:${({theme})=>theme.colors.textSecondary};`;
const Input = styled.input`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  ${focusable}
`;
const TextArea = styled.textarea`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  ${focusable}
`;
const Select = styled.select`
  padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
  ${focusable}
`;
const Check = styled.label`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;`;
const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};justify-content:flex-end;`;
const Primary = styled.button`
  background:${({theme})=>theme.buttons.primary.background};color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer; ${focusable}
  &:hover{background:${({theme})=>theme.buttons.primary.backgroundHover};}
`;
const Secondary = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:8px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer; ${focusable}
`;
const BtnRow = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};align-items:center;`;

/* transient prop: $danger (DOM'a sızmaz) */
const Mini = styled.button<{ $danger?: boolean }>`
  padding:6px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({$danger,theme})=>$danger?theme.colors.dangerBg:theme.buttons.secondary.background};
  color:${({$danger,theme})=>$danger?theme.colors.danger:theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  ${focusable}
`;

const Hint = styled.span`opacity:0.7;font-size:${({theme})=>theme.fontSizes.xsmall};`;
