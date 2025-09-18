"use client";

import { useEffect, useState, type ReactNode } from "react";
import styled from "styled-components";
import AdminSidebar from "@/layout/AdminSidebar";

export default function AdminFrame({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Hydration için ilk render kapalı
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sidebarOpen = mounted ? open : false;

  return (
    <Shell>
      <AsideWrap>
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setOpen(false)} />
      </AsideWrap>

      <Main>
        <TopBar>
          <Burger onClick={() => setOpen(true)} aria-label="Menü">☰</Burger>
          <h1>Admin</h1>
        </TopBar>
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}

/* ---------- styled ---------- */
const Shell = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const AsideWrap = styled.aside`
  /* Mobilde yer kaplamasın; tıklamayı engellemesin -> pointer-events KALDIRILDI */
  @media (max-width: 900px) {
    position: static;
    width: 0;
    height: 0;
    /* pointer-events: none;  <-- kaldırıldı */
  }

  @media (min-width: 901px) {
    position: relative;
    width: 240px;
  }
`;

const Main = styled.div` background: ${({theme})=>theme.colors.background}; `;
const TopBar = styled.div`
  display:flex; align-items:center; gap:10px;
  background:${({theme})=>theme.colors.cardBackground};
  border-bottom:1px solid ${({theme})=>theme.colors.borderBright};
  padding:10px 14px;
`;
const Burger = styled.button`
  width:36px;height:36px;border-radius:${({theme})=>theme.radii.lg};
  background:${({theme})=>theme.colors.inputBackgroundLight};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  @media (min-width:901px){ display:none; }
`;
const Content = styled.main`
  max-width:${({theme})=>theme.layout.containerWidth}; margin:16px auto; padding:0 16px 32px;
`;
