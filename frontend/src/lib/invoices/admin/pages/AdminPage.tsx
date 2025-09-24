"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/invoices";
import {
  fetchAllInvoicesAdmin,
  clearInvoiceMessages,
} from "@/modules/invoices/slice/invoicesSlice";
import type { IInvoice } from "@/modules/invoices/types";
import { InvoiceList, InvoiceForm } from "@/modules/invoices";

export default function AdminInvoicesPage() {
  const { t } = useI18nNamespace("invoices", translations);
  const dispatch = useAppDispatch();
  const { invoicesAdmin, loading, error, successMessage } = useAppSelector(
    (s) => s.invoices
  );

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IInvoice | null>(null);

  // İlk yükleme: /invoicing listesi
  useEffect(() => {
    dispatch(fetchAllInvoicesAdmin());
  }, [dispatch]);

  // Toast’lar (çeviri anahtarı ya da düz metin)
  useEffect(() => {
    if (successMessage) toast.success(t(successMessage, successMessage));
    if (error) toast.error(t(error, error));
    if (successMessage || error) dispatch(clearInvoiceMessages());
  }, [successMessage, error, dispatch, t]);

  const count = useMemo(
    () => (Array.isArray(invoicesAdmin) ? invoicesAdmin.length : 0),
    [invoicesAdmin]
  );

  return (
    <PageWrap role="main" aria-busy={loading}>
      <Header>
        <h1>{t("title", "Invoices")}</h1>
        <Right>
          <Counter aria-label={t("count", "count")}>{count}</Counter>
          <PrimaryBtn
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            aria-label={t("new", "New")}
          >
            + {t("new", "New")}
          </PrimaryBtn>
        </Right>
      </Header>

      {showForm && (
        <Card aria-label={t("createOrEdit", "Create / Edit Invoice")}>
          <InvoiceForm
            initial={editing || undefined}
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              dispatch(fetchAllInvoicesAdmin());
            }}
          />
        </Card>
      )}

      <Section>
        <SectionHead>
          <h2>{t("list", "Invoices")}</h2>
          <SmallBtn
            onClick={() => dispatch(fetchAllInvoicesAdmin())}
            disabled={loading}
            aria-busy={loading}
          >
            {t("refresh", "Refresh")}
          </SmallBtn>
        </SectionHead>
        <Card>
          <InvoiceList
            items={invoicesAdmin || []}
            loading={loading}
            onEdit={(i) => {
              setEditing(i);
              setShowForm(true);
            }}
          />
        </Card>
      </Section>
    </PageWrap>
  );
}

/* ---- styled ---- */
const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};

  /* Küçük ekranlarda iç boşlukları biraz azalt */
  ${({ theme }) => theme.media.mobile} {
    padding: ${({ theme }) => theme.spacings.lg};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacings.lg};

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacings.sm};
  }

  h1 {
    margin: 0;
  }
`;

const Right = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.sm};
  align-items: center;
`;

const Counter = styled.span`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacings.xl};
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacings.sm};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.lg};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
`;

const PrimaryBtn = styled.button`
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  border: ${({ theme }) => theme.borders.thin}
    ${({ theme }) => theme.buttons.primary.backgroundHover};
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.normal};
  &:hover {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
  }
  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    cursor: not-allowed;
  }
`;

const SmallBtn = styled.button`
  background: ${({ theme }) => theme.buttons.secondary.background};
  color: ${({ theme }) => theme.buttons.secondary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.normal};
  &:hover {
    background: ${({ theme }) => theme.buttons.secondary.backgroundHover};
  }
  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    cursor: not-allowed;
  }
`;
