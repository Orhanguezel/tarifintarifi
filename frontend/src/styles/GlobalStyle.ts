// src/styles/GlobalStyle.ts
"use client";
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root { color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    font-family: ${({theme}) => theme.fonts.body};
    background: ${({theme}) => theme.colors.background};
    color: ${({theme}) => theme.colors.text};
    line-height: ${({theme}) => theme.lineHeights.normal};
    font-size: ${({theme}) => theme.fontSizes.base};
  }

  a {
    color: ${({theme}) => theme.colors.link};
    text-decoration: none;
    transition: color ${({theme}) => theme.transition.normal};
  }
  a:hover { color: ${({theme}) => theme.colors.linkHover}; }
`;
