"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { useLoginMutation, useRegisterMutation } from "@/lib/users/api.client";

type TabKey = "login" | "register";

export default function AuthPage() {
  const sp = useSearchParams();
  const initialTab = (sp.get("tab") as TabKey) ?? "login";
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <Wrap>
      <Card>
        <Title>Hesap</Title>

        <Tabs>
          <Tab $active={tab === "login"} onClick={() => setTab("login")} aria-pressed={tab === "login"} aria-label="Giriş">
            Giriş
          </Tab>
          <Tab $active={tab === "register"} onClick={() => setTab("register")} aria-pressed={tab === "register"} aria-label="Kayıt">
            Kayıt
          </Tab>
        </Tabs>

        {tab === "login" ? <LoginForm /> : <RegisterForm onSwitchToLogin={() => setTab("login")} />}
      </Card>
    </Wrap>
  );
}

/* --------------------- Login --------------------- */

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, isSuccess, error, data }] = useLoginMutation();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const errText = useErrorText(error);

  useEffect(() => {
    if (isSuccess && data?.email) {
      // başarılı login → admin
      router.replace(`/${locale}/admin`);
    }
  }, [isSuccess, data?.email, router, locale]);

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();
        await login({ email: email.trim(), password }).unwrap().catch(() => {});
      }}
    >
      <Field>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>

      <Field>
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </Field>

      <ButtonPrimary type="submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? "Giriş yapılıyor…" : "Giriş Yap"}
      </ButtonPrimary>

      {isSuccess && <SuccessText>Giriş başarılı. Çerezler ayarlandı.</SuccessText>}
      {errText && <ErrorText role="alert">{errText}</ErrorText>}

      {data?.email && (
        <HelpText>
          Hoş geldin <b>{data.email}</b> ({data.role})
        </HelpText>
      )}
    </Form>
  );
}

/* --------------------- Register --------------------- */

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading, isSuccess, error, data }] = useRegisterMutation();
  const errText = useErrorText(error);

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();
        await register({ email: email.trim(), password, role: "admin" })
          .unwrap()
          .then(() => onSwitchToLogin())
          .catch(() => {});
      }}
    >
      <Field>
        <Label htmlFor="reg-email">E-posta</Label>
        <Input id="reg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>

      <Field>
        <Label htmlFor="reg-password">Şifre</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </Field>

      <ButtonSuccess type="submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? "Kaydediliyor…" : "Kayıt Ol"}
      </ButtonSuccess>

      {isSuccess && <SuccessText>Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz…</SuccessText>}
      {errText && <ErrorText role="alert">{errText}</ErrorText>}

      {data?.email && (
        <HelpText>
          Oluşturuldu: <b>{data.email}</b> ({data.role})
        </HelpText>
      )}
    </Form>
  );
}

/* --------------------- helpers --------------------- */

function useErrorText(error: unknown) {
  return useMemo(() => {
    if (!error || typeof error !== "object") return "";
    const e = error as any;
    const code = e?.status;
    const msg =
      e?.data?.error ||
      e?.error ||
      (typeof e?.data === "string" ? e.data : "") ||
      "";
    if (code === 401) return "Kimlik doğrulama hatası.";
    if (code === 409) return "Bu e-posta zaten kayıtlı.";
    if (code === 422) return "Geçersiz alanlar, lütfen kontrol edin.";
    return msg || "Bir şeyler ters gitti.";
  }, [error]);
}

/* --------------------- styled --------------------- */

const Wrap = styled.main`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 24px auto 48px;
  padding: 0 20px;
  display: grid;
  place-items: center;
`;

const Card = styled.section`
  width: 100%;
  max-width: 520px;
  background: ${({ theme }) => theme.cards.background};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 22px;
`;

const Title = styled.h1`
  margin: 6px 0 18px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.h2};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.text};
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 6px;
  margin-bottom: 18px;
  gap: 6px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.durations.fast} ease,
    color ${({ theme }) => theme.durations.fast} ease,
    box-shadow ${({ theme }) => theme.durations.fast} ease;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : theme.colors.textSecondary};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.backgroundAlt : "transparent"};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadows.sm : "none")};

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.backgroundAlt : theme.colors.hoverBackground};
  }
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

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

  &::placeholder {
    color: ${({ theme }) => theme.inputs.placeholder};
  }

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

  &:disabled {
    opacity: ${({ theme }) => theme.opacity.disabled};
    cursor: not-allowed;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ButtonPrimary = styled(ButtonBase)`
  background: ${({ theme }) => theme.buttons.primary.background};
  &:hover {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
  }
`;

const ButtonSuccess = styled(ButtonBase)`
  background: ${({ theme }) => theme.buttons.success.background};
  &:hover {
    background: ${({ theme }) => theme.buttons.success.backgroundHover};
  }
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

const HelpText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;
