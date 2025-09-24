"use client";

import { PropsWithChildren, useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "@/styles/GlobalStyle";
import classicTheme from "@/styles/classicTheme";
import type { DefaultTheme } from "styled-components";
import { tokensToTheme } from "@/lib/theme/tokens"; // istersen bırak, yoksa inline map edebiliriz
import { makeStore } from "@/store/makeStore";

export default function ProvidersClient({
  children,
  locale,
  themeTokens,
  navigation, // ileride Navbar/Footer’a props olarak iletmek istersen hazır
}: PropsWithChildren<{
  locale: string;
  themeTokens?: any;
  navigation?: any;
}>) {
  const theme: DefaultTheme = useMemo(() => {
    // BE tokens varsa styled-components DefaultTheme’e çevir,
    // yoksa gönderdiğin classicTheme’i kullan.
    try {
      if (themeTokens && Object.keys(themeTokens).length) {
        // tokensToTheme, DefaultTheme bekleyen mapping'in sende zaten var ise kullan
        return { ...classicTheme, ...tokensToTheme(themeTokens) } as DefaultTheme;
      }
    } catch {}
    return classicTheme;
  }, [themeTokens]);

  return (
    <ReduxProvider store={makeStore()}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
