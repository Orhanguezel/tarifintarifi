"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/newsletter/locales";
import { useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { subscribeNewsletter, clearNewsletterState } from "@/modules/newsletter/slice/newsletterSlice";
import { Send } from "lucide-react";
import { useRecaptcha } from "@/hooks/useRecaptcha";

export default function NewsletterSection() {
  const { t } = useI18nNamespace("newsletter", translations);
  const dispatch = useAppDispatch();
  const execRecaptcha = useRecaptcha();

  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const mountedAt = useRef<number>(Date.now());
  const [localError, setLocalError] = useState<string | null>(null);

  const { loading, error, successMessage } = useAppSelector((s) => s.newsletter);
  const canSubmit = useMemo(() => !!email && !loading, [email, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const tts = Date.now() - mountedAt.current;
    if (tts < 800) {
      setLocalError(t("human_check", "Lütfen güvenlik kontrolü için bir saniye bekleyip tekrar deneyin."));
      return;
    }

    const recaptchaToken = await execRecaptcha("newsletter_subscribe");
    if (!recaptchaToken) {
      setLocalError(t("captcha_failed", "reCAPTCHA doğrulaması başarısız oldu."));
      return;
    }

    const res: any = await dispatch(
      subscribeNewsletter({
        email: email.trim().toLowerCase(),
        recaptchaToken,
        hp,
        tts,
      })
    );

    if (res?.meta?.requestStatus === "fulfilled") {
      setTimeout(() => {
        dispatch(clearNewsletterState());
        setEmail("");
      }, 1600);
    }
  }

  return (
    <Section
      as={motion.section}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <Content>
        <SectionHead>
          <MinorTitle>
            {t("section.our", "Our")} <b>{t("section.newsletter", "Newsletter")}</b>
          </MinorTitle>
          <MainTitle>{t("section.title", "Newsletter")}</MainTitle>
          <Desc>
            {t("section.desc", "There are many variations of passages of Lorem Ipsum available but the majority have suffered injected humour dummy now.")}
          </Desc>
        </SectionHead>

        <FormWrap>
          <StyledForm onSubmit={handleSubmit} autoComplete="off" noValidate>
            {/* Honeypot */}
            <Honeypot aria-hidden="true">
              <input
                name="company"
                autoComplete="off"
                tabIndex={-1}
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </Honeypot>

            <EmailInput
              type="email"
              placeholder={t("form.email", "Enter Email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-label={t("form.email", "Enter Email")}
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
            />
            <SubmitBtn type="submit" disabled={!canSubmit}>
              {t("form.subscribe", "Subscribe")}
              <Send size={20} style={{ marginLeft: 7, marginBottom: -2 }} />
            </SubmitBtn>
          </StyledForm>

          {successMessage && <SuccessMsg>{t("success", "Thank you! You are subscribed.")}</SuccessMsg>}
          {(localError || error) && <ErrorMsg>{localError || error}</ErrorMsg>}
        </FormWrap>

        <Note>
          {t("section.note1", "Contact Us To Get Your")}{" "}
          <a href="/contact">{t("section.workdone", "Work Done")}</a>{" "}
          {t("section.note2", "Thank You")}
        </Note>
      </Content>
    </Section>
  );
}

/* ---------------- STYLES (mevcut tasarıma dokunmadan) ---------------- */

const Section = styled(motion.section)`
  background: ${({ theme }) => theme.colors.sectionBackground};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  padding: ${({ theme }) => theme.spacings.xxxl} 0 ${({ theme }) => theme.spacings.xxl};
`;

const Content = styled.div`
  max-width: 1280px; margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacings.xl};
  display: flex; flex-direction: column; align-items: flex-start;
  @media (max-width: 900px) {
    padding-left: ${({ theme }) => theme.spacings.md};
    padding-right: ${({ theme }) => theme.spacings.md};
  }
  @media (max-width: 600px) {
    padding-left: ${({ theme }) => theme.spacings.sm};
    padding-right: ${({ theme }) => theme.spacings.sm};
    align-items: center;
  }
`;

const SectionHead = styled.div`
  text-align: left; margin-bottom: 2.1rem;
  @media (max-width: 600px) { text-align: center; width: 100%; }
`;

const MinorTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  text-transform: uppercase; letter-spacing: .03em; margin-bottom: .18em;
  b { color: ${({ theme }) => theme.colors.accent}; font-weight: ${({ theme }) => theme.fontWeights.bold}; }
`;

const MainTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extraBold};
  margin: 0 0 .22em 0; letter-spacing: -0.01em; line-height: 1.13;
`;

const Desc = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  line-height: 1.7; margin-bottom: .9rem; max-width: 600px; opacity: .94;
`;

const FormWrap = styled.div`
  margin: .7rem 0 .6rem 0; width: 100%; max-width: 700px;
  display: flex; flex-direction: column; align-items: flex-start;
  @media (max-width: 600px) { align-items: center; max-width: 100%; }
`;

const StyledForm = styled.form`
  display: flex; width: 100%;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 2.1em;
  border: ${({ theme }) => theme.borders.thick} ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden; align-items: center; margin-bottom: .6em;
  transition: border-color ${({ theme }) => theme.transition.fast};
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    box-shadow: 0 2px 10px ${({ theme }) => theme.colors.primaryTransparent};
  }
  @media (max-width: 600px) {
    flex-direction: column; border-radius: ${({ theme }) => theme.radii.lg};
    border-width: 1px; box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const Honeypot = styled.div`
  position: absolute !important;
  left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden;
`;

const EmailInput = styled.input`
  flex: 1 1 68%;
  border: none; background: transparent; color: ${({ theme }) => theme.colors.textPrimary};
  padding: 1.1em 1.7em; font-size: 1.1em; font-family: ${({ theme }) => theme.fonts.body};
  outline: none; background: ${({ theme }) => theme.colors.inputBackground};
  font-weight: 400; border-radius: 0;
  &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; opacity: .91; letter-spacing: .01em; }
  @media (max-width: 600px) {
    padding: .9em 1em; width: 100%;
    border-radius: ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0 0;
  }
`;

const SubmitBtn = styled.button`
  flex: 0 0 auto;
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: 1.09em; font-family: ${({ theme }) => theme.fonts.main};
  border: none; padding: .98em 2.3em; border-radius: 2em;
  margin: 8px 12px 8px 0; box-shadow: ${({ theme }) => theme.shadows.button};
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};
  &:hover, &:focus-visible { background: ${({ theme }) => theme.buttons.primary.backgroundHover};
    color: ${({ theme }) => theme.buttons.primary.textHover}; }
  &:disabled { opacity: ${({ theme }) => theme.opacity.disabled}; cursor: not-allowed; }
  @media (max-width: 600px) {
    width: 100%; margin: 0 0 7px 0;
    border-radius: 0 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md};
    font-size: 1em; padding: .75em 1.1em;
  }
`;

const SuccessMsg = styled.div`
  color: ${({ theme }) => theme.colors.success};
  font-size: 1.05em; text-align: left; margin: .6em 0 .2em 0; font-family: ${({ theme }) => theme.fonts.body};
`;
const ErrorMsg = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 1em; text-align: left; margin: .6em 0 .2em 0; font-family: ${({ theme }) => theme.fonts.body};
`;

const Note = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2.7em; font-size: 1.02em; font-family: ${({ theme }) => theme.fonts.body};
  width: 100%; text-align: center;
  a { color: ${({ theme }) => theme.colors.accent}; text-decoration: underline; font-weight: 600;
      transition: color .16s; &:hover { color: ${({ theme }) => theme.colors.accentHover}; } }
  @media (max-width: 600px) { font-size: .96em; }
`;
