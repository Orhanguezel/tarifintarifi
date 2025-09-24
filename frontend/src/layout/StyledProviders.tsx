"use client";

import { PropsWithChildren, useMemo } from "react";
import { ThemeProvider } from "styled-components";
import type { DefaultTheme } from "styled-components";
import classicTheme from "@/styles/classicTheme";
import { GlobalStyle } from "@/styles/GlobalStyle";

/** Basit derin birleştirme – bağımlılık eklemeden */
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

export default function StyledProviders({
  children,
  /** BE’den gelen token patch (DefaultTheme’in herhangi bir alt kümesi) */
  tokens,
  /** İleride RTL diller için direction vermek istersen burada kullanabilirsin */
  locale,
}: PropsWithChildren<{ tokens?: Partial<DefaultTheme>; locale?: string }>) {
  const theme: DefaultTheme = useMemo(
    () => deepMerge(classicTheme, tokens),
    [tokens]
  );

  // Örn. RTL ihtiyacı olursa:
  // const dir = ["ar","fa","he","ur"].includes((locale||"").toLowerCase()) ? "rtl" : "ltr";

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
