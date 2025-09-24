"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSelectedCustomer,
  createCustomerAdmin,
  updateCustomerAdmin,
  deleteCustomerAdmin,
  clearCustomerMessages,
} from "@/modules/customer/slice/customerSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/customer/locales";
import { CustomerForm, CustomerInfoCard } from "@/modules/customer";
import CustomerDetailsPage from "@/modules/customer/admin/components/CustomerDetailsPage";
import Modal from "@/shared/Modal";
import type { ICustomer } from "@/modules/customer/types";

/* ---------- Filtre Tipi (client-side) ---------- */
type CustomerAdminFilters = Partial<{
  q: string;
  kind: "person" | "organization";
  isActive: boolean;
}>;

/* ---------- Varsayılan müşteri ---------- */
const defaultCustomer: ICustomer = {
  tenant: "",
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  addresses: [],
  isActive: true,
  notes: "",
};

export default function AdminCustomerPage() {
  const { t } = useI18nNamespace("customer", translations);
  const dispatch = useAppDispatch();

  const customers = useAppSelector((s) => s.customer.customerAdmin);
  const selected = useAppSelector((s) => s.customer.selected);
  const loading = useAppSelector((s) => s.customer.loading);
  const successMessage = useAppSelector((s) => s.customer.successMessage);
  const error = useAppSelector((s) => s.customer.error);

  // detay modalı (adres yönetimi)
  const [detailsCustomer, setDetailsCustomer] = useState<ICustomer | null>(null);

  // filtre state
  const [filters, setFilters] = useState<CustomerAdminFilters>({});

  // parent fetch ettiği için burada fetch yok!
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => dispatch(clearCustomerMessages()), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const initialValues: ICustomer = useMemo(() => {
    if (selected) return { ...defaultCustomer, ...selected };
    return defaultCustomer;
  }, [selected]);

  /* ---------- Client-side filtreleme ---------- */
  const textOf = (v?: any) =>
    typeof v === "string"
      ? v
      : v && typeof v === "object"
      ? Object.values(v).filter(Boolean).join(" ")
      : "";

  const matchesQ = (c: ICustomer, q = "") => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [
      c.companyName,
      c.contactName,
      c.email,
      c.phone,
      (c as any)?.slug,
      Array.isArray((c as any)?.tags) ? (c as any).tags.join(" ") : "",
    ]
      .map(textOf)
      .some((s) => s.toLowerCase().includes(needle));
  };

  const visible = useMemo(() => {
    return (customers || []).filter((c) => {
      if (!matchesQ(c, filters.q)) return false;
      if (filters.kind && (c as any)?.kind !== filters.kind) return false;
      if (typeof filters.isActive === "boolean" && c.isActive !== filters.isActive)
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, filters]);

  /* ---------- Actions ---------- */
  const handleSubmit = (values: ICustomer) => {
    if (values._id) {
      dispatch(updateCustomerAdmin({ id: values._id, data: values }));
    } else {
      dispatch(createCustomerAdmin(values));
    }
  };

  const handleAddNew = () => dispatch(setSelectedCustomer(null));
  const handleSelectCustomer = (cust: ICustomer) => dispatch(setSelectedCustomer(cust));

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm(t("deleteConfirm", "Are you sure you want to delete this customer?"))) {
      dispatch(deleteCustomerAdmin(id));
    }
  };

  const resetFilters = () => setFilters({});
  const apply = () => {
    // şu an client-side
  };

  return (
    <PageWrap>
      <PageHead>
        <div>
          <H1>{t("title", "Customer Management")}</H1>
          <Subtle>{t("subtitle", "Create, edit and manage customers.")}</Subtle>
        </div>
        <Actions>
          <Primary onClick={handleAddNew} disabled={loading}>
            {t("addNew", "Add New")}
          </Primary>
        </Actions>
      </PageHead>

      {(error || successMessage) && (
        <Banner $type={error ? "error" : "success"} role="status">
          <span>{error || successMessage}</span>
          <CloseBtn
            onClick={() => dispatch(clearCustomerMessages())}
            aria-label={t("common.close", "Close")}
          >
            ×
          </CloseBtn>
        </Banner>
      )}

      {/* 1) ÜSTTE: Filtreler */}
      <SectionCard as="section" aria-label={t("filters", "Filters")}>
        <Toolbar>
          <Filters>
            <Input
              placeholder={t("search", "Search")}
              value={filters.q || ""}
              onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
            />
            <Select
              value={filters.kind || ""}
              onChange={(e) =>
                setFilters((s) => ({ ...s, kind: (e.target.value || undefined) as any }))
              }
              aria-label={t("kind", "Kind")}
              title={t("kind", "Kind")}
            >
              <option value="">{t("kind.any", "All kinds")}</option>
              <option value="person">{t("kind.person", "Person")}</option>
              <option value="organization">{t("kind.organization", "Organization")}</option>
            </Select>
            <Select
              value={typeof filters.isActive === "boolean" ? String(filters.isActive) : ""}
              onChange={(e) =>
                setFilters((s) => ({
                  ...s,
                  isActive: e.target.value === "" ? undefined : e.target.value === "true",
                }))
              }
              aria-label={t("active", "Active?")}
              title={t("active", "Active?")}
            >
              <option value="">{t("active.any", "All statuses")}</option>
              <option value="true">{t("active.only", "Only Active")}</option>
              <option value="false">{t("active.no", "Inactive")}</option>
            </Select>
          </Filters>
          <ToolbarActions>
            <Secondary type="button" onClick={resetFilters} disabled={loading}>
              {t("reset", "Reset")}
            </Secondary>
            <Primary type="button" onClick={apply} disabled={loading}>
              {loading ? t("common.loading", "Loading…") : t("apply", "Apply")}
            </Primary>
          </ToolbarActions>
        </Toolbar>
      </SectionCard>

      {/* 2) ALTTA: Liste */}
      <SectionCard as="section" aria-label={t("list", "Customers")}>
        <CustomerList role="list">
          {visible.length === 0 && !loading && (
            <Empty role="status">{t("empty", "No customers found")}</Empty>
          )}

          {visible.map((cust) => {
            const title = cust.companyName?.trim() || cust.contactName || "-";
            return (
              <CustomerRow
                role="listitem"
                key={String(cust._id)}
                $active={selected?._id === cust._id}
                onClick={() => handleSelectCustomer(cust)}
              >
                <RowMain>
                  <TextCol>
                    <TitleSm title={title}>{title}</TitleSm>
                    <Meta>
                      <span>{cust.contactName || "-"}</span>
                      <Dot>•</Dot>
                      <span>{cust.email || "-"}</span>
                      <Dot>•</Dot>
                      <span>{cust.phone || "-"}</span>
                    </Meta>
                  </TextCol>
                  <RowActions>
                    <Secondary
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailsCustomer(cust);
                      }}
                    >
                      {t("editAddresses", "Manage Addresses")}
                    </Secondary>
                    <Danger
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(String(cust._id));
                      }}
                    >
                      {t("delete", "Delete")}
                    </Danger>
                  </RowActions>
                </RowMain>
                <TagsWrap>
                  {!!cust.isActive ? (
                    <Tag>{t("active", "Active")}</Tag>
                  ) : (
                    <Tag>{t("inactive", "Inactive")}</Tag>
                  )}
                  {((cust as any)?.kind) && (
                    <Tag>
                      {(cust as any).kind === "organization"
                        ? t("kind.organization", "Organization")
                        : t("kind.person", "Person")}
                    </Tag>
                  )}
                </TagsWrap>
              </CustomerRow>
            );
          })}
        </CustomerList>
      </SectionCard>

      {/* 3) EN ALTTA: Bilgi kartı + Form */}
      <SectionCard as="section" aria-label={t("form.section", "Customer Form")}>
        {selected && <CustomerInfoCard customer={selected} />}
        <CustomerForm initialValues={initialValues} onSubmit={handleSubmit} loading={loading} />
      </SectionCard>

      {/* Adres yönetimi modalı */}
      <Modal isOpen={!!detailsCustomer} onClose={() => setDetailsCustomer(null)}>
        {detailsCustomer && <CustomerDetailsPage customer={detailsCustomer} />}
      </Modal>
    </PageWrap>
  );
}

/* ================= styled (Apartment standardı, tamamen dikey & responsive) ================= */
const PageWrap = styled.div`
  display:flex; flex-direction:column; gap:${({theme})=>theme.spacings.md};
  padding:${({theme})=>theme.spacings.md};
  max-width:100%;
`;

const PageHead = styled.header`
  display:flex; align-items:flex-end; justify-content:space-between; gap:${({theme})=>theme.spacings.sm};
  ${({theme})=>theme.media.mobile}{ align-items:stretch; flex-direction:column; }
`;
const H1 = styled.h1`
  margin:0; font-size:${({theme})=>theme.fontSizes.large}; color:${({theme})=>theme.colors.title};
  font-family:${({theme})=>theme.fonts.heading};
`;
const Subtle = styled.p`
  margin:.25rem 0 0; color:${({theme})=>theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.xsmall};
`;
const Actions = styled.div`display:flex; gap:${({theme})=>theme.spacings.sm}; flex-wrap:wrap;`;

/* Banner */
const Banner = styled.div<{ $type: "success" | "error" }>`
  display:flex; align-items:center; justify-content:space-between; gap:${({theme})=>theme.spacings.sm};
  border:${({theme})=>theme.borders.thin} ${({theme,$type})=>$type==="success"? theme.colors.success : theme.colors.danger};
  background:${({theme,$type})=>$type==="success"? theme.colors.successBg : theme.colors.dangerBg};
  color:${({theme,$type})=>$type==="success"? theme.colors.textOnSuccess : theme.colors.textOnDanger};
  border-radius:${({theme})=>theme.radii.lg}; padding:${({theme})=>theme.spacings.sm} ${({theme})=>theme.spacings.md};
  max-width:100%;
`;
const CloseBtn = styled.button`
  border:none; background:transparent; color:inherit; font-size:20px; cursor:pointer; line-height:1;
`;

/* Genel kart sarmalayıcı (Apartment ile aynı his) */
const SectionCard = styled.div`
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.md};
  display:flex; flex-direction:column; gap:${({theme})=>theme.spacings.md};
  min-width:0; max-width:100%;
`;

/* Toolbar */
const Toolbar = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:${({theme})=>theme.spacings.sm};
  ${({theme})=>theme.media.tablet}{ flex-direction:column; align-items:stretch; }
`;
const Filters = styled.div`
  display:grid; gap:${({theme})=>theme.spacings.sm};
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  width:100%;
  min-width:0;
`;
const ToolbarActions = styled.div`
  display:flex; gap:${({theme})=>theme.spacings.sm};
  flex-wrap:wrap;
`;

/* Inputs & Buttons */
const Input = styled.input`
  width:100%;
  padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
  &::placeholder{ color:${({theme})=>theme.colors.placeholder}; }
  &:focus{ outline:none; border-color:${({theme})=>theme.inputs.borderFocus}; box-shadow:${({theme})=>theme.colors.shadowHighlight}; background:${({theme})=>theme.colors.inputBackgroundFocus}; }
`;
const Select = styled.select`
  width:100%;
  padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
  &:focus{ outline:none; border-color:${({theme})=>theme.inputs.borderFocus}; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
`;
const BaseBtn = styled.button`
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
  border:${({theme})=>theme.borders.thin} transparent; transition:${({theme})=>theme.transition.normal};
  &:disabled{ opacity:${({theme})=>theme.opacity.disabled}; cursor:not-allowed; }
  &:focus-visible{ outline:none; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
`;
const Primary = styled(BaseBtn)`
  background:${({theme})=>theme.buttons.primary.background}; color:${({theme})=>theme.buttons.primary.text};
  border-color:${({theme})=>theme.buttons.primary.backgroundHover};
  &:hover{ background:${({theme})=>theme.buttons.primary.backgroundHover}; color:${({theme})=>theme.buttons.primary.textHover}; }
`;
const Secondary = styled(BaseBtn)`
  background:${({theme})=>theme.buttons.secondary.background}; color:${({theme})=>theme.buttons.secondary.text};
  border-color:${({theme})=>theme.colors.border};
  &:hover{ background:${({theme})=>theme.buttons.secondary.backgroundHover}; color:${({theme})=>theme.buttons.secondary.textHover}; }
`;
const Danger = styled(BaseBtn)`
  background:${({theme})=>theme.colors.dangerBg}; color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger}; &:hover{ filter:brightness(0.98); }
`;

/* Liste */
const CustomerList = styled.div`
  display:flex; flex-direction:column; gap:${({theme})=>theme.spacings.sm};
  max-height: calc(100vh - 320px); overflow:auto;
  -webkit-overflow-scrolling: touch;
  width:100%;
`;

const CustomerRow = styled.div<{ $active?: boolean }>`
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderLight};
  background:${({ $active, theme }) => ($active ? theme.colors.backgroundAlt : theme.colors.cardBackground)};
  border-radius:${({theme})=>theme.radii.md};
  padding:${({theme})=>theme.spacings.sm};
  cursor:pointer; transition: background .15s ease, box-shadow .15s ease;
  &:hover{ background:${({theme})=>theme.colors.hoverBackground}; box-shadow:${({theme})=>theme.shadows.xs}; }
`;

const RowMain = styled.div`
  display:flex; align-items:flex-start; justify-content:space-between; gap:${({theme})=>theme.spacings.sm};
  min-width:0; flex-wrap:wrap;
`;
const TextCol = styled.div`min-width:0; flex:1 1 auto;`;

const TitleSm = styled.div`
  font-weight:${({theme})=>theme.fontWeights.semiBold};
  font-size:${({theme})=>theme.fontSizes.medium};
  color:${({theme})=>theme.colors.title};
  margin-bottom:.15rem;
  overflow-wrap:anywhere; word-break:break-word;
`;

const Meta = styled.div`
  color:${({theme})=>theme.colors.textSecondary}; font-size:${({theme})=>theme.fontSizes.xsmall};
  display:flex; align-items:center; gap:${({theme})=>theme.spacings.xs}; flex-wrap:wrap;
  overflow-wrap:anywhere; word-break:break-word;
`;
const Dot = styled.span`opacity:.6;`;

const RowActions = styled.div`
  display:flex; gap:${({theme})=>theme.spacings.xs};
  flex-wrap:wrap; justify-content:flex-end;
`;

const TagsWrap = styled.div`
  display:flex; gap:${({theme})=>theme.spacings.xs}; flex-wrap:wrap; margin-top:${({theme})=>theme.spacings.xs};
`;
const Tag = styled.span`
  background:${({theme})=>theme.colors.tagBackground}; color:${({theme})=>theme.colors.textSecondary};
  border-radius:${({theme})=>theme.radii.pill}; padding:2px 8px; font-size:${({theme})=>theme.fontSizes.xsmall};
`;

const Empty = styled.div`
  padding:${({theme})=>theme.spacings.md}; text-align:center; color:${({theme})=>theme.colors.textSecondary};
  overflow-wrap:anywhere;
`;
