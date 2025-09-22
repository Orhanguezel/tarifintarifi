// src/features/recipes/components/detail/parts/Hero.tsx
"use client";

import Image from "next/image";
import styled, { useTheme } from "styled-components";

export default function Hero({
  src,
  alt,
  priority = true,
  ratio = 16 / 9,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  ratio?: number;
}) {
  const theme = useTheme() as any;

  // Tema container genişliğini px'e çevir (örn. "960px" -> 960)
  const toPx = (v?: string) => {
    const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  // Eğer temada yoksa makul bir varsayılan kullan
  const containerPx =
    toPx(theme?.layout?.containerWidth) ??
    toPx(theme?.layout?.contentWidth) ??
    960;

  // Breakpoint'lere uygun sizes: mobilde tam genişlik, üstünde container px
  const sizes = `(max-width: 768px) 100vw, ${containerPx}px`;

  return (
    <HeroWrap $ratio={ratio}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        style={{ objectFit: "cover" }}
      />
    </HeroWrap>
  );
}

const HeroWrap = styled.div<{ $ratio: number }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii?.xl ?? "16px"};
  background: linear-gradient(180deg,#eef2f7 0%,#e8eef7 100%);
  box-shadow: ${({ theme }) => theme.cards?.shadow ?? "none"};
`;
