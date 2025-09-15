// src/app/providers.tsx
"use client";

import React, { useRef } from "react";
import { Provider as ReduxProvider } from "react-redux";
import type { AppStore } from "@/store";
import { makeStore } from "@/store";
import { ThemeProvider } from "styled-components";
import classicTheme from "@/styles/classicTheme";
import { GlobalStyle } from "@/styles/GlobalStyle";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  // Başlangıç değeri veriyoruz
  const storeRef = useRef<AppStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = makeStore();
  }
  const store = storeRef.current; // artık null değil

  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={classicTheme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
