"use client";

import { useState } from "react";
import Script from "next/script";
import styled, { createGlobalStyle } from "styled-components";
import { useTranslations, useLocale } from "next-intl";
import { useCreateRecipeCommentMutation } from "@/lib/comments/api";

/* ---------- reCAPTCHA config ---------- */
const ENABLED = (process.env.NEXT_PUBLIC_ENABLE_RECAPTCHA || "false") === "true";
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
const ACTION   = (process.env.NEXT_PUBLIC_RECAPTCHA_ACTION || "comment_create").toLowerCase();

/* UI: rozeti küçült / köşeye sabitle (gizlemek istersen body’ye .captcha-branding-inline ekle) */
const RecaptchaTweaks = createGlobalStyle`
  .grecaptcha-badge {
    position: fixed !important;
    bottom: 12px !important;
    right: 12px !important;
    z-index: 50 !important;
    transform: scale(.82);
    transform-origin: 100% 100%;
  }
  @media (max-width: 480px) { .grecaptcha-badge { transform: scale(.72); } }
  body.captcha-branding-inline .grecaptcha-badge { display: none !important; }
`;

/* reCAPTCHA'nin beklediği dil kodu – bazıları özel */
function recaptchaHL(loc: string) {
  const map: Record<string, string> = {
    "zh": "zh-CN", "zh-cn": "zh-CN", "zh-tw": "zh-TW",
    "pt": "pt-PT", "pt-br": "pt-BR", "pt-pt": "pt-PT",
  };
  return (map[loc.toLowerCase()] || loc || "en").replace("_", "-");
}

/** reCAPTCHA Enterprise token al (ready → execute) */
async function getRecaptchaToken(): Promise<string> {
  if (!ENABLED || typeof window === "undefined" || !SITE_KEY) return "";
  // @ts-ignore
  const gre = window.grecaptcha?.enterprise || window.grecaptcha;
  if (!gre) return "";
  await new Promise<void>((ok) => { try { gre.ready(ok); } catch { ok(); } });
  try {
    const token: string = await gre.execute(SITE_KEY, { action: ACTION });
    return typeof token === "string" ? token : "";
  } catch {
    return "";
  }
}

/* ---------- Component ---------- */
export default function CommentForm({ recipeId }: { recipeId: string }) {
  const t = useTranslations("comments");
  const locale = useLocale();
  const hl = recaptchaHL(locale);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [create, { isLoading }] = useCreateRecipeCommentMutation();
  const [note, setNote] = useState<null | { ok?: boolean; msg: string }>(null);

  const canSend =
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    text.trim().length >= 3 &&
    !isLoading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    setNote(null);

    let token = "";
    if (ENABLED) {
      token = await getRecaptchaToken();
      if (!token || token.length < 10) {
        setNote({
          ok: false,
          msg: t("captchaErr") || "Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyip tekrar deneyin.",
        });
        return;
      }
    }

    const payload: any = {
      recipeId,
      body: { name, email, text },
      ...(ENABLED ? { recaptchaToken: token, recaptchaAction: ACTION } : {}),
    };

    const res = await create(payload);

    if ("data" in res && (res.data as any)?.success) {
      setText("");
      setNote({ ok: true, msg: t("sentOk") ?? "Gönderildi" });
    } else {
      const apiMsg =
        ("error" in res && (res.error as any)?.data?.message) ||
        ("data" in res && (res.data as any)?.message);
      setNote({ ok: false, msg: apiMsg || (t("sentErr") ?? "Bir hata oluştu") });
    }
  };

  return (
    <>
      {/* reCAPTCHA sadece bu formda yüklensin + doğru dilde olsun */}
      {ENABLED && SITE_KEY && (
        <Script
          id="grecaptcha-enterprise"
          src={`https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}&hl=${hl}`}
          strategy="afterInteractive"
        />
      )}
      <RecaptchaTweaks />

      <Form onSubmit={onSubmit}>
        <TextArea
          placeholder={t("placeholder") || "Tarifle ilgili deneyimini yaz..."}
          aria-label={t("text")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          minLength={3}
        />

        <Row>
          <NameInput
            placeholder={t("nameShort") || "Adın"}
            aria-label={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <EmailInput
            placeholder={t("emailShort") || "E-posta"}
            aria-label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            type="email"
          />
          <Submit type="submit" disabled={!canSend}>
            {isLoading ? t("sending") : t("submitLong") || "Yorumu Gönder"}
          </Submit>
        </Row>

        {note && (
          <Note role="status" aria-live="polite" data-variant={note.ok ? "ok" : "err"}>
            {note.msg}
          </Note>
        )}

        {/* Rozeti TAM gizlemek istersen:
            - <body> elementine `captcha-branding-inline` sınıfını ekle
            - ve aşağıdaki yasal notu görünür yap */}
        {/*
        <LegalNote>
          Bu site reCAPTCHA ile korunmaktadır.{" "}
          <a href={`https://policies.google.com/privacy?hl=${hl}`} target="_blank" rel="noopener">Gizlilik</a> ·{" "}
          <a href={`https://policies.google.com/terms?hl=${hl}`} target="_blank" rel="noopener">Şartlar</a>
        </LegalNote>
        */}
      </Form>
    </>
  );
}

/* ---------- styled ---------- */
const Form = styled.form`
  margin-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderBright};
  padding-top: 12px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.inputs.border};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  outline: none;
  resize: vertical;
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; }
  &:focus {
    border-color: ${({ theme }) => theme.inputs.borderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-top: 10px;
  ${({ theme }) => theme.media?.mobile} { grid-template-columns: 1fr; }
`;

const BaseInput = styled.input`
  height: 42px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.inputs.border};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  outline: none;
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; }
  &:focus {
    border-color: ${({ theme }) => theme.inputs.borderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
    background: ${({ theme }) => theme.colors.inputBackgroundFocus};
  }
`;

const NameInput  = styled(BaseInput)``;
const EmailInput = styled(BaseInput).attrs({ type: "email" })``;

const Submit = styled.button`
  height: 42px;
  padding: 0 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.button};
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover { background: ${({ theme }) => theme.buttons.primary.backgroundHover}; }
  &:disabled { opacity: .7; cursor: not-allowed; }
`;

const Note = styled.div`
  margin-top: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  &[data-variant="ok"]  { background: ${({ theme }) => theme.colors.successBg}; color: ${({ theme }) => theme.colors.textOnSuccess}; border-color: rgba(24,169,87,.25); }
  &[data-variant="err"] { background: ${({ theme }) => theme.colors.dangerBg};  color: ${({ theme }) => theme.colors.textOnDanger};  border-color: rgba(229,72,77,.25); }
`;

const LegalNote = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  a { color: inherit; text-decoration: underline; }
`;
