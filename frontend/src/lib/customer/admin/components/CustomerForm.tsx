"use client";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";
import type { ICustomer } from "@/modules/customer/types";

type Props = {
  initialValues: ICustomer;
  onSubmit: (values: ICustomer) => void;
  loading?: boolean;
};

export default function CustomerForm({ initialValues, onSubmit, loading }: Props) {
  const { t } = useI18nNamespace("customer", translations);

  // ---------- Users (parent state) ----------
  const rawUsers = useAppSelector((s: any) => s?.userCrud?.users ?? []);
  const users = useMemo(() => (Array.isArray(rawUsers) ? rawUsers : []), [rawUsers]);

  const userLabel = (u: any) => {
    const name =
      u?.fullName?.trim?.() ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
      "";
    return [name || u?.username, u?.email].filter(Boolean).join(" — ");
  };

  // ---------- Local state (v2 model) ----------
  const [userRef, setUserRef] = useState<string | undefined>(
    (initialValues as any)?.userRef || undefined
  );
  const [linkToUser, setLinkToUser] = useState<boolean>(!!(initialValues as any)?.userRef);

  const [kind, setKind] = useState<"person" | "organization">(
    ((initialValues as any)?.kind as any) || "person"
  );

  const [companyName, setCompanyName] = useState<string>(initialValues.companyName || "");
  const [contactName, setContactName] = useState<string>(initialValues.contactName || "");
  const [email, setEmail] = useState<string>(initialValues.email || "");
  const [phone, setPhone] = useState<string>(initialValues.phone || "");
  const [isActive, setIsActive] = useState<boolean>(
    typeof initialValues.isActive === "boolean" ? initialValues.isActive : true
  );
  const [notes, setNotes] = useState<string>(initialValues.notes || "");
  const [slug, setSlug] = useState<string>((initialValues as any)?.slug || "");

  // billing
  const [taxNumber, setTaxNumber] = useState<string>((initialValues as any)?.billing?.taxNumber || "");
  const [iban, setIban] = useState<string>((initialValues as any)?.billing?.iban || "");
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "EUR" | "TRY" | "">(
    ((initialValues as any)?.billing?.defaultCurrency as any) || ""
  );
  const [paymentTermDays, setPaymentTermDays] = useState<number | "">(
    typeof (initialValues as any)?.billing?.paymentTermDays === "number"
      ? (initialValues as any)?.billing?.paymentTermDays
      : ""
  );
  const [defaultDueDayOfMonth, setDefaultDueDayOfMonth] = useState<number | "">(
    typeof (initialValues as any)?.billing?.defaultDueDayOfMonth === "number"
      ? (initialValues as any)?.billing?.defaultDueDayOfMonth
      : ""
  );

  // tags (comma separated UI)
  const initialTags = useMemo(() => {
    const tgs = (initialValues as any)?.tags;
    return Array.isArray(tgs) ? tgs.join(", ") : "";
  }, [initialValues]);
  const [tagsInput, setTagsInput] = useState<string>(initialTags);

  // hydrate on prop change
  useEffect(() => {
    setUserRef((initialValues as any)?.userRef || undefined);
    setLinkToUser(!!(initialValues as any)?.userRef);
    setKind(((initialValues as any)?.kind as any) || "person");

    setCompanyName(initialValues.companyName || "");
    setContactName(initialValues.contactName || "");
    setEmail(initialValues.email || "");
    setPhone(initialValues.phone || "");
    setIsActive(typeof initialValues.isActive === "boolean" ? initialValues.isActive : true);
    setNotes(initialValues.notes || "");
    setSlug((initialValues as any)?.slug || "");

    setTaxNumber((initialValues as any)?.billing?.taxNumber || "");
    setIban((initialValues as any)?.billing?.iban || "");
    setDefaultCurrency(((initialValues as any)?.billing?.defaultCurrency as any) || "");
    setPaymentTermDays(
      typeof (initialValues as any)?.billing?.paymentTermDays === "number"
        ? (initialValues as any)?.billing?.paymentTermDays
        : ""
    );
    setDefaultDueDayOfMonth(
      typeof (initialValues as any)?.billing?.defaultDueDayOfMonth === "number"
        ? (initialValues as any)?.billing?.defaultDueDayOfMonth
        : ""
    );
    setTagsInput(
      Array.isArray((initialValues as any)?.tags) ? (initialValues as any)?.tags.join(", ") : ""
    );
  }, [initialValues]);

  // when a user is selected (creation helper): optionally prefill empty fields
  const onSelectUser = (id: string) => {
    setUserRef(id || undefined);
    if (!id) return;
    const u = users.find((x: any) => String(x._id) === String(id));
    if (!u) return;
    // only prefill empty fields
    const fullName =
      u?.fullName?.trim?.() ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
      u?.username ||
      "";
    if (!contactName?.trim() && fullName) setContactName(fullName);
    if (!email?.trim() && u?.email) setEmail(String(u.email));
    if (!phone?.trim() && u?.phone) setPhone(String(u.phone));
  };

  // ---------- Submit ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName?.trim() || !email?.trim() || !phone?.trim()) {
      alert(t("customer.validation.requiredFields", "Lütfen zorunlu alanları doldurun."));
      return;
    }

    const billing =
      taxNumber || iban || defaultCurrency || paymentTermDays !== "" || defaultDueDayOfMonth !== ""
        ? {
            taxNumber: taxNumber || undefined,
            iban: iban || undefined,
            defaultCurrency: defaultCurrency || undefined,
            paymentTermDays: paymentTermDays === "" ? undefined : Number(paymentTermDays),
            defaultDueDayOfMonth: defaultDueDayOfMonth === "" ? undefined : Number(defaultDueDayOfMonth),
          }
        : undefined;

    const tags = tagsInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const payload: any = {
      ...initialValues,
      kind,
      companyName: companyName || "", // opsiyonel
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      isActive: !!isActive,
      notes: notes?.trim() || undefined,
      slug: slug?.trim() || undefined,
      billing,
      tags: tags.length ? tags : undefined,
    };

    if (linkToUser && userRef) payload.userRef = userRef;
    if (!linkToUser) payload.userRef = undefined; // bağlantıyı kaldırabilmek için

    onSubmit(payload);
  };

  const selectedUserName = useMemo(() => {
    if (!userRef) return "";
    const u = users.find((x: any) => String(x._id) === String(userRef));
    return u ? userLabel(u) : "";
  }, [userRef, users]);

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {/* USER bağlama + tür */}
      <Card>
        <Sub>{t("form.identity","Identity & Link")}</Sub>
        <RowGrid>
          <div>
            <Label>{t("form.kind","Customer Type")}</Label>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as "person" | "organization")}
              disabled={loading}
            >
              <option value="person">{t("kind.person","Person")}</option>
              <option value="organization">{t("kind.organization","Organization")}</option>
            </Select>
          </div>

          <div>
            <Label>{t("form.linkUser","Link to User (optional)")}</Label>
            <Select
              value={userRef || ""}
              onChange={(e) => onSelectUser(e.target.value)}
              disabled={loading}
            >
              <option value="">{t("form.selectUser","Select user")}</option>
              {users.map((u: any) => (
                <option key={u._id} value={u._id}>{userLabel(u)}</option>
              ))}
            </Select>
            <SmallRow>
              <input
                id="link-user"
                type="checkbox"
                checked={linkToUser}
                onChange={(e)=>setLinkToUser(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="link-user">{t("form.enableLink","Save link to this user")}</label>
            </SmallRow>
            {selectedUserName && <Hint>{t("form.selectedUser","Selected")}: {selectedUserName}</Hint>}
          </div>
        </RowGrid>
      </Card>

      {/* Temel bilgiler */}
      <Card>
        <Sub>{t("customerInfo","Customer Info")}</Sub>
        <RowGrid>
          <div>
            <Label>{t("companyName","Company Name")}{kind === "organization" ? " *" : ""}</Label>
            <Input
              value={companyName}
              onChange={(e)=>setCompanyName(e.target.value)}
              disabled={loading}
              placeholder={kind === "organization" ? t("companyRequired","Company is required") : t("companyOptional","Optional")}
              required={kind === "organization"}
            />
          </div>
          <div>
            <Label>{t("contactName","Contact Name")} <Req>*</Req></Label>
            <Input value={contactName} onChange={(e)=>setContactName(e.target.value)} disabled={loading} required />
          </div>
          <div>
            <Label>{t("email","E-Mail")} <Req>*</Req></Label>
            <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={loading} required />
          </div>
          <div>
            <Label>{t("phone","Phone")} <Req>*</Req></Label>
            <Input value={phone} onChange={(e)=>setPhone(e.target.value)} disabled={loading} required />
          </div>
          <div>
            <Label>{t("slug","Slug (optional)")}</Label>
            <Input value={slug} onChange={(e)=>setSlug(e.target.value)} disabled={loading} placeholder="acme-corp" />
          </div>
          <Check>
            <input id="isActive" type="checkbox" checked={isActive} onChange={(e)=>setIsActive(e.target.checked)} disabled={loading} />
            <label htmlFor="isActive">{t("isActive","Active")}</label>
          </Check>
        </RowGrid>
        <Row>
          <Label>{t("notes","Notes")}</Label>
          <Textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} disabled={loading} />
        </Row>
      </Card>

      {/* Faturalama */}
      <Card>
        <Sub>{t("billing","Billing Preferences")}</Sub>
        <RowGrid>
          <div>
            <Label>{t("taxNumber","Tax Number")}</Label>
            <Input value={taxNumber} onChange={(e)=>setTaxNumber(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label>{t("iban","IBAN")}</Label>
            <Input value={iban} onChange={(e)=>setIban(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label>{t("defaultCurrency","Default Currency")}</Label>
            <Select value={defaultCurrency} onChange={(e)=>setDefaultCurrency(e.target.value as any)} disabled={loading}>
              <option value="">{t("any","Any")}</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </Select>
          </div>
          <div>
            <Label>{t("paymentTermDays","Payment Term (days)")}</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={paymentTermDays}
              onChange={(e)=>setPaymentTermDays(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loading}
              placeholder="e.g. 14"
            />
          </div>
          <div>
            <Label>{t("defaultDueDayOfMonth","Default Due Day (1-28)")}</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={defaultDueDayOfMonth}
              onChange={(e)=>setDefaultDueDayOfMonth(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loading}
              placeholder="e.g. 15"
            />
          </div>
        </RowGrid>
      </Card>

      {/* Etiketler */}
      <Card>
        <Sub>{t("tags","Tags")}</Sub>
        <Row>
          <Label>{t("tagsComma","Comma-separated tags")}</Label>
          <Input
            value={tagsInput}
            onChange={(e)=>setTagsInput(e.target.value)}
            disabled={loading}
            placeholder="vip, manager, priority"
          />
        </Row>
      </Card>

      <Actions>
        <Secondary type="button" disabled={loading} onClick={()=>{
          // basit reset: initialValues’e dön
          setKind(((initialValues as any)?.kind as any) || "person");
          setCompanyName(initialValues.companyName || "");
          setContactName(initialValues.contactName || "");
          setEmail(initialValues.email || "");
          setPhone(initialValues.phone || "");
          setIsActive(typeof initialValues.isActive === "boolean" ? initialValues.isActive : true);
          setNotes(initialValues.notes || "");
          setSlug((initialValues as any)?.slug || "");
          setTaxNumber((initialValues as any)?.billing?.taxNumber || "");
          setIban((initialValues as any)?.billing?.iban || "");
          setDefaultCurrency(((initialValues as any)?.billing?.defaultCurrency as any) || "");
          setPaymentTermDays(
            typeof (initialValues as any)?.billing?.paymentTermDays === "number"
              ? (initialValues as any)?.billing?.paymentTermDays
              : ""
          );
          setDefaultDueDayOfMonth(
            typeof (initialValues as any)?.billing?.defaultDueDayOfMonth === "number"
              ? (initialValues as any)?.billing?.defaultDueDayOfMonth
              : ""
          );
          setTagsInput(Array.isArray((initialValues as any)?.tags) ? (initialValues as any)?.tags.join(", ") : "");
          setUserRef((initialValues as any)?.userRef || undefined);
          setLinkToUser(!!(initialValues as any)?.userRef);
        }}>
          {t("common.reset","Reset")}
        </Secondary>
        <Primary type="submit" disabled={loading} aria-label={t("save","Save Customer")}>
          {t("save","Save Customer")}
        </Primary>
      </Actions>
    </Form>
  );
}

/* ---------------- styled: apartment sayfası ile tam uyum ---------------- */
const Form = styled.form`
  display:flex; flex-direction:column; gap:${({theme})=>theme.spacings.md};
`;
const Row = styled.div`display:flex; flex-direction:column; gap:.5rem;`;
const RowGrid = styled.div`
  display:grid; gap:${({theme})=>theme.spacings.sm};
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
`;
const Label = styled.label`
  font-size:${({theme})=>theme.fontSizes.xsmall}; color:${({theme})=>theme.colors.textSecondary};
`;
const Hint = styled.div`
  font-size:${({theme})=>theme.fontSizes.xsmall}; color:${({theme})=>theme.colors.textSecondary};
  margin-top:.25rem;
`;
const SmallRow = styled.div`display:flex; align-items:center; gap:.5rem; margin-top:.35rem;`;
const Req = styled.span`color:${({theme})=>theme.colors.danger};`;

const Input = styled.input`
  padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
  &::placeholder{ color:${({theme})=>theme.colors.placeholder}; }
  &:focus{ outline:none; border-color:${({theme})=>theme.inputs.borderFocus}; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
`;
const Select = styled.select`
  padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
  &:focus{ outline:none; border-color:${({theme})=>theme.inputs.borderFocus}; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
`;
const Textarea = styled.textarea`
  min-height:96px; padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
`;

const Card = styled.div`
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  padding:${({theme})=>theme.spacings.md};
  box-shadow:${({theme})=>theme.cards.shadow};
`;
const Sub = styled.div`
  font-weight:${({theme})=>theme.fontWeights.semiBold};
  margin-bottom:${({theme})=>theme.spacings.xs};
  color:${({theme})=>theme.colors.textAlt};
`;

const Actions = styled.div`
  display:flex; gap:${({theme})=>theme.spacings.sm}; justify-content:flex-end;
`;
const BaseBtn = styled.button`
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md};
  cursor:pointer; border:${({theme})=>theme.borders.thin} transparent;
  transition:${({theme})=>theme.transition.normal};
  &:disabled{ opacity:${({theme})=>theme.opacity.disabled}; cursor:not-allowed; }
  &:focus-visible{ outline:none; box-shadow:${({theme})=>theme.colors.shadowHighlight}; }
`;
const Primary = styled(BaseBtn)`
  background:${({theme})=>theme.buttons.primary.background}; color:${({theme})=>theme.buttons.primary.text};
  &:hover{ background:${({theme})=>theme.buttons.primary.backgroundHover}; color:${({theme})=>theme.buttons.primary.textHover}; }
`;
const Secondary = styled(BaseBtn)`
  background:${({theme})=>theme.buttons.secondary.background}; color:${({theme})=>theme.buttons.secondary.text};
  &:hover{ background:${({theme})=>theme.buttons.secondary.backgroundHover}; color:${({theme})=>theme.buttons.secondary.textHover}; }
`;
const Check = styled.div`
  display:flex; align-items:center; gap:.5rem; margin-top:.35rem;
  input[type="checkbox"]{ width:16px; height:16px; }
  label{ font-size:${({theme})=>theme.fontSizes.xsmall}; color:${({theme})=>theme.colors.textSecondary}; }
`;
