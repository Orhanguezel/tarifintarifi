"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { useMeQuery, useLogoutMutation } from "@/lib/users/api.client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { data: me, error, isLoading } = useMeQuery();
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
        <Title>Admin Paneli</Title>
        <Muted>Giriş yapan: <b>{me.email}</b> — rol: <b>{me.role}</b></Muted>

        <Spacer />

        <Muted>
          Soldaki menüden bir bölüm seçin. (Örn. <b>Kullanıcı</b> sekmesiyle
          profilinizi düzenleyebilir veya şifrenizi değiştirebilirsiniz.)
        </Muted>

        <Spacer />

        <Row>
          <ButtonDanger
            onClick={async () => {
              try { await logout().unwrap(); }
              finally { router.replace(`/${locale}/login?tab=login`); }
            }}
            disabled={loggingOut}
          >
            Çıkış Yap
          </ButtonDanger>
        </Row>
      </Card>
    </PageWrap>
  );
}

/* ---------- styled ---------- */
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
const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const Spacer = styled.div` height: 16px; `;
const Row = styled.div` display: flex; justify-content: flex-end; `;
const ButtonDanger = styled.button`
  border: none; border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px 16px; font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: #fff; background: ${({ theme }) => theme.colors.danger};
  transition: background ${({ theme }) => theme.durations.fast} ease;
  &:hover { background: ${({ theme }) => theme.colors.dangerHover}; }
`;
const Note = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;
