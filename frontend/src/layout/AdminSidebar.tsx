// src/layout/AdminSidebar.tsx
"use client";

import React, { useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  MdHome, MdFastfood, MdRateReview, MdFavoriteBorder,
  MdSettings, MdLogout, MdClose, MdPerson
} from "react-icons/md";
import { useLogoutMutation } from "@/lib/users/api.client";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SIDEBAR_WIDTH = 240;

/* Aktif link kontrolü */
const isActive = (currentPath: string, linkPath: string) => {
  if (!currentPath) return false;
  if (linkPath.endsWith("/")) linkPath = linkPath.replace(/\/+$/, "");
  return currentPath === linkPath || currentPath.startsWith(linkPath + "/");
};

/**
 * Next Link'i styled-components ile güvenle sarmalıyoruz
 * ve prefetch'i attrs ile kalıcı olarak kapatıyoruz.
 * (Map içinde verilen prefetch={false} bazı sürümlerde sızmayabiliyor.)
 */
type NextLinkProps = React.ComponentProps<typeof Link>;
const LinkBase = (props: NextLinkProps) => <Link {...props} />;
const NavLink = styled(LinkBase).attrs({ prefetch: false })<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  margin: ${({ theme }) => theme.spacings.xs} 0;
  text-decoration: none;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  font-weight: ${({ $active, theme }) => ($active ? theme.fontWeights.semiBold : theme.fontWeights.regular)};
  background: ${({ $active, theme }) => ($active ? theme.colors.backgroundAlt : "transparent")};
  border-left: 3px solid ${({ $active, theme }) => ($active ? theme.colors.primary : "transparent")};
  transition: ${({ theme }) => theme.transition.fast};
  &:hover { color: ${({ theme }) => theme.colors.primary}; background: ${({ theme }) => theme.colors.hoverBackground}; }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

/* Brand (logo) linki için de prefetch'i kapatıyoruz */
const BrandLink = styled(LinkBase).attrs({ prefetch: false })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.sm};
  text-decoration: none;
  color: inherit;
  flex: 1;
  min-width: 0;
  &:hover span { color: ${({ theme }) => theme.colors.primary}; }
`;

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname() || "";
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  // ESC ile kapat (mobil)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  // Body scroll kilidi (mobil açıkken)
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const LINKS = [
    { href: `/${locale}/admin`, label: "Dashboard", Icon: MdHome },
    { href: `/${locale}/admin/users`, label: "Kullanıcı", Icon: MdPerson },
    { href: `/${locale}/admin/recipes`, label: "Tarifler", Icon: MdFastfood },
    { href: `/${locale}/admin/comments`, label: "Yorumlar", Icon: MdRateReview },
    { href: `/${locale}/admin/reactions`, label: "Reaksiyonlar", Icon: MdFavoriteBorder },
    { href: `/${locale}/admin/settings`, label: "Ayarlar", Icon: MdSettings },
  ];

  return (
    <>
      <Aside $isOpen={isOpen} aria-label="Admin menü" aria-expanded={isOpen} data-open={isOpen}>
        <TopBar>
          <BrandLink href={`/${locale}`} onClick={onClose}>
            <BrandIcon>🍳</BrandIcon>
            <div>
              <BrandTitle>tarifintarifi</BrandTitle>
              <BrandSub>Admin</BrandSub>
            </div>
          </BrandLink>
          <CloseBtn onClick={onClose} aria-label="Kapat">
            <MdClose size={22} />
          </CloseBtn>
        </TopBar>

        <Nav>
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <NavLink key={href} href={href} $active={active} onClick={onClose}>
                <IconBox $active={active}><Icon size={18} /></IconBox>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </Nav>

        <Footer>
          <LogoutBtn
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              try { await logout().unwrap(); } catch {}
              onClose();
              router.replace(`/${locale}/login?tab=login`);
            }}
          >
            <IconBox><MdLogout size={18} /></IconBox>
            Çıkış Yap
          </LogoutBtn>
        </Footer>
      </Aside>

      <Overlay $isOpen={isOpen} onClick={onClose} aria-hidden={!isOpen} />
    </>
  );
}

/* ================= styled ================= */

const Aside = styled.aside<{ $isOpen: boolean }>`
  width: ${SIDEBAR_WIDTH}px;
  min-width: ${SIDEBAR_WIDTH}px;
  max-width: ${SIDEBAR_WIDTH}px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-right: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1301;
  box-shadow: 0 0 26px rgba(0,0,0,.07);

  /* Off-canvas başlangıç */
  will-change: transform;
  transform: translateX(-100%);
  transition: transform 0.27s cubic-bezier(.86,.01,.35,1.06);

  @media (max-width: 900px) {
    transform: ${({ $isOpen }) => ($isOpen ? "translateX(0)" : "translateX(-100%)")};
  }

  /* Desktop: hep açık */
  @media (min-width: 901px) {
    transform: none !important;
    position: sticky;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  @media (max-width: 900px) {
    display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.28);
    z-index: 1200;
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacings.md};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
`;

const BrandIcon = styled.div`
  width: 32px; height: 32px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: grid; place-items: center;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 18px;
`;

const BrandTitle = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.1;
`;
const BrandSub = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CloseBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  background: none; border: none; color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  @media (min-width: 901px) { display: none; }
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacings.sm} 0;
  overflow-y: auto;
`;

const IconBox = styled.div<{ $active?: boolean }>`
  width: 24px; height: 24px; display: grid; place-items: center;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacings.md};
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
`;

const LogoutBtn = styled.button`
  display: flex; align-items: center; gap: ${({ theme }) => theme.spacings.sm};
  width: 100%; background: none; border: none; cursor: pointer;
  color: ${({ theme }) => theme.colors.danger};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};
  &:hover { background: ${({ theme }) => theme.colors.hoverBackground}; }
`;
