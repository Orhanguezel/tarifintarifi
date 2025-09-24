"use client";

import React, { useMemo, useRef } from "react";
import { Provider as ReduxProvider } from "react-redux";
import type { AppStore } from "@/store/makeStore";
import { makeStore } from "@/store/makeStore";

import { ThemeProvider } from "styled-components";
import type { DefaultTheme } from "styled-components";
import classicTheme from "@/styles/classicTheme";
import { GlobalStyle } from "@/styles/GlobalStyle";

/** Hafif deep-merge (bağımlılık yok) */
function deepMerge<T extends Record<string, any>>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(patch)) {
    const pv = (patch as any)[k];
    const bv = (base as any)[k];
    if (pv && typeof pv === "object" && !Array.isArray(pv) && bv && typeof bv === "object" && !Array.isArray(bv)) {
      out[k] = deepMerge(bv, pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
}

type ProvidersProps = {
  children: React.ReactNode;
  /** Opsiyonel: BE’den gelen tema yamaları */
  themeTokens?: Partial<DefaultTheme>;
};

export default function Providers({ children, themeTokens }: ProvidersProps) {
  // Store deterministik olarak tek kez oluşturulsun
  const storeRef = useRef<AppStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = makeStore();
  }
  const store = storeRef.current;

  // Tema: classicTheme + (varsa) patch
  const theme: DefaultTheme = useMemo(
    () => deepMerge(classicTheme, themeTokens),
    [themeTokens]
  );

  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
