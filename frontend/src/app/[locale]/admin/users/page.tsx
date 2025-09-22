// src/app/[locale]/admin/users/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import {
  useMeQuery,
  useChangePasswordMutation,
  useLogoutMutation,
} from "@/lib/users/api.client";

export default function AdminUserPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const { data: me, error, isLoading, refetch } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  useEffect(() => {
    const status = (error as any)?.status;
    if (status === 401 || status === 403) {
      router.replace(`/${locale}/login?tab=login`);
    }
  }, [error, router, locale]);

  if (isLoading) return <PageWrap><Note>Yükleniyor…</Note></PageWrap>;
  if (!me) return null;

  return (
    <PageWrap>
      <Card>
        <Title>Kullanıcı</Title>
        <Muted>Hesap: <b>{me.email}</b> — rol: <b>{me.role}</b></Muted>

        <SectionTitle>Profil</SectionTitle>
        <Form onSubmit={(e)=>e.preventDefault()}>
          <Field>
            <Label>E-posta</Label>
            <Input type="email" value={me.email} disabled />
            <Hint>Şimdilik e-posta değişikliği kapalı.</Hint>
          </Field>
        </Form>

        <Divider />

        <SectionTitle>Şifre Değiştir</SectionTitle>
        <ChangePasswordForm onSuccess={() => refetch()} />

        <Divider />

        <DangerZone
          meEmail={me.email}
          onAfterDelete={async () => {
            try { await logout().unwrap(); } finally {
              router.replace(`/${locale}/login?tab=login`);
            }
          }}
        />
      </Card>
    </PageWrap>
  );
}

/* -------- Şifre değiştir -------- */
function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmNewPassword, setConfirm] = useState("");
  const [changePassword, { isLoading, isSuccess, error }] = useChangePasswordMutation();

  const canSubmit = useMemo(
    () => currentPassword.length >= 6 && newPassword.length >= 8 && confirmNewPassword === newPassword,
    [currentPassword, newPassword, confirmNewPassword]
  );

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        try {
          await changePassword({ payload: { currentPassword, newPassword, confirmNewPassword } }).unwrap();
          onSuccess();
        } catch {}
      }}
    >
      <Field>
        <Label>Mevcut şifre</Label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required minLength={6} />
      </Field>
      <Field>
        <Label>Yeni şifre</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} />
      </Field>
      <Field>
        <Label>Yeni şifre (tekrar)</Label>
        <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </Field>

      <ButtonPrimary type="submit" disabled={!canSubmit || isLoading} aria-busy={isLoading}>
        {isLoading ? "Kaydediliyor…" : "Şifreyi Güncelle"}
      </ButtonPrimary>

      {isSuccess && <SuccessText>Şifre güncellendi.</SuccessText>}
      {Boolean(error) && (
  <ErrorText>{(error as any)?.data?.error || "Şifre güncellenemedi."}</ErrorText>
)}
    </Form>
  );
}

/* -------- Tehlikeli Bölge -------- */
function DangerZone({ meEmail, onAfterDelete }:{
  meEmail: string;
  onAfterDelete: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");

  const canDelete = confirm.trim() === meEmail.trim();

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    try {
      const r = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error || `Silme başarısız (HTTP ${r.status})`);
        return;
      }
      await onAfterDelete();
    } catch (e:any) {
      alert(e?.message || "Silme işlemi sırasında sorun oluştu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionTitle>Tehlikeli Bölge</SectionTitle>
      <DangerBox>
        <p><b>Hesabı Sil</b></p>
        <p>Bu işlem geri alınamaz. Onay için e-posta adresinizi yazın:</p>
        <Form onSubmit={(e)=>{e.preventDefault(); handleDelete();}}>
          <Field>
            <Label>E-posta doğrulama</Label>
            <Input
              placeholder={meEmail}
              value={confirm}
              onChange={(e)=>setConfirm(e.target.value)}
            />
          </Field>

          <ButtonDanger type="submit" disabled={!canDelete || busy} aria-busy={busy}>
            {busy ? "Siliniyor…" : "Hesabı Kalıcı Olarak Sil"}
          </ButtonDanger>
        </Form>
      </DangerBox>
    </>
  );
}

/* -------- styled -------- */
const PageWrap = styled.main`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 24px auto 48px;
  padding: 0 20px;
  display: grid;
  place-items: center;
`;
const Card = styled.section`
  width: 100%;
  max-width: 720px;
  background: ${({ theme }) => theme.cards.background};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 22px;
`;
const Title = styled.h1`
  margin: 6px 0 18px;
  font-size: ${({ theme }) => theme.fontSizes.h2};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.text};
`;
const SectionTitle = styled.h2`
  margin: 22px 0 12px;
  font-size: ${({ theme }) => theme.fontSizes.h3};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;
const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: 18px 0;
`;
const DangerBox = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.dangerBg};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 14px;
  p { margin: 4px 0; }
`;
const Form = styled.form` display: grid; gap: 12px; `;
const Field = styled.div` display: grid; gap: 6px; `;
const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
const Input = styled.input`
  width: 100%;
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  outline: none;
  transition: border-color ${({ theme }) => theme.durations.normal} ease,
    box-shadow ${({ theme }) => theme.durations.normal} ease,
    background ${({ theme }) => theme.durations.normal} ease;
  &::placeholder { color: ${({ theme }) => theme.inputs.placeholder}; }
  &:focus {
    border-color: ${({ theme }) => theme.inputs.borderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
`;
const ButtonBase = styled.button`
  width: 100%;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: #fff;
  cursor: pointer;
  transition: background ${({ theme }) => theme.durations.fast} ease,
    transform ${({ theme }) => theme.durations.fast} ease,
    box-shadow ${({ theme }) => theme.durations.fast} ease;
  &:disabled { opacity: ${({ theme }) => theme.opacity.disabled}; cursor: not-allowed; }
  &:active { transform: translateY(1px); }
`;
const ButtonPrimary = styled(ButtonBase)`
  background: ${({ theme }) => theme.buttons.primary.background};
  &:hover { background: ${({ theme }) => theme.buttons.primary.backgroundHover}; }
`;
const ButtonDanger = styled(ButtonBase)`
  background: ${({ theme }) => theme.colors.danger};
  &:hover { background: ${({ theme }) => theme.colors.dangerHover}; }
`;
const Note = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;
const SuccessText = styled.p`
  color: ${({ theme }) => theme.colors.textOnSuccess};
  background: ${({ theme }) => theme.colors.successBg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerBg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`;
