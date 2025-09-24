// src/modules/payments/ui/AdminPaymentsPage.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { clearPaymentMsgs, fetchPaymentsAdmin } from "@/modules/payments/slice/paymentsSlice";
import { PaymentList, PaymentForm } from "@/modules/payments";
import type { IPayment } from "@/modules/payments/types";
import { translations } from "@/modules/payments";


export default function AdminPaymentsPage() {
  const { t, i18n } = useI18nNamespace("payments", translations);
  const dispatch = useAppDispatch();
  const { items, loading, error, success } = useAppSelector(s => s.payments);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IPayment | null>(null);

  useEffect(()=>{ dispatch(fetchPaymentsAdmin(undefined)); },[dispatch]);

  useEffect(()=>{
    if (success) toast.success(success);
    if (error) toast.error(error);
    if (success || error) dispatch(clearPaymentMsgs());
  },[success, error, dispatch]);

  const nf = useMemo(()=> new Intl.NumberFormat(i18n.language), [i18n.language]);
  const count = useMemo(()=>items?.length ?? 0, [items]);

  return (
    <PageWrap>
      <Header>
        <Title>{t("page.title","Payments")}</Title>
        <Right>
          <Counter aria-label={t("page.countAria","Total payments")}>
            {t("page.countLabel","Count")}: {nf.format(count)}
          </Counter>
          <PrimaryBtn
            onClick={()=>{ setEditing(null); setShowForm(true); }}
            aria-label={t("actions.new","New Payment")}
            disabled={loading}
          >
            + {t("actions.new","New Payment")}
          </PrimaryBtn>
        </Right>
      </Header>

      {showForm && (
        <Card role="region" aria-label={t("form.regionLabel","Create or edit payment")}>
          <PaymentForm
            initial={editing || undefined}
            onClose={()=>setShowForm(false)}
            onSaved={()=>{ setShowForm(false); dispatch(fetchPaymentsAdmin(undefined)); }}
          />
        </Card>
      )}

      <Section>
        <SectionHead>
          <h2>{t("sections.list","Payments List")}</h2>
          <SmallBtn
            onClick={()=>dispatch(fetchPaymentsAdmin(undefined))}
            disabled={loading}
            aria-label={t("actions.refresh","Refresh")}
          >
            {loading ? t("common.loading","Loading...") : t("actions.refresh","Refresh")}
          </SmallBtn>
        </SectionHead>
        <Card>
          <PaymentList
            items={items || []}
            loading={loading}
            onEdit={(p)=>{ setEditing(p); setShowForm(true); }}
          />
        </Card>
      </Section>
    </PageWrap>
  );
}

/* styled */
const PageWrap = styled.div`max-width:${({theme})=>theme.layout.containerWidth};margin:0 auto;padding:${({theme})=>theme.spacings.xl};`;
const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:${({theme})=>theme.spacings.lg};
  ${({theme})=>theme.media.mobile}{flex-direction:column;align-items:flex-start;gap:${({theme})=>theme.spacings.sm};}
`;
const Title = styled.h1`margin:0;`;
const Right = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};align-items:center;`;
const Counter = styled.span`padding:6px 10px;border-radius:${({theme})=>theme.radii.pill};background:${({theme})=>theme.colors.backgroundAlt};font-weight:${({theme})=>theme.fontWeights.medium};`;
const Section = styled.section`margin-top:${({theme})=>theme.spacings.xl};`;
const SectionHead = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:${({theme})=>theme.spacings.sm};`;
const Card = styled.div`background:${({theme})=>theme.colors.cardBackground};border-radius:${({theme})=>theme.radii.lg};box-shadow:${({theme})=>theme.cards.shadow};padding:${({theme})=>theme.spacings.lg};`;
const PrimaryBtn = styled.button`
  background:${({theme})=>theme.buttons.primary.background};color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 12px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;
const SmallBtn = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;
