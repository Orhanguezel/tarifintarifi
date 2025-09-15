import type { DefaultTheme } from "styled-components";

const classicTheme: DefaultTheme = {
  templateName: "classic",

  /* ---------- Typography ---------- */
  fonts: {
    main: "'Segoe UI', Arial, sans-serif",
    special: "'Georgia', serif",
    heading: "'Georgia', serif",
    body: "'Segoe UI', Arial, sans-serif",
    mono: "'Fira Code', monospace",
  },

  fontSizes: {
    base: "16px",
    xsmall: "12px",
    small: "14px",
    medium: "16px",
    large: "20px",
    xlarge: "28px",
    h1: "clamp(2.2rem, 5vw, 3.2rem)",
    h2: "2rem",
    h3: "1.5rem",
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.25rem",
  },

  fontWeights: {
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
  },

  lineHeights: {
    normal: "1.5",
    relaxed: "1.65",
    loose: "1.9",
  },

  /* ---------- Spacing / Radius / Shadows ---------- */
  spacings: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    xxxl: "48px",
  },

  radii: {
    none: "0px",
    sm: "6px",
    md: "10px",
    lg: "12px",
    xl: "16px",
    pill: "9999px",
    circle: "50%",
  },

  borders: {
    thin: "1px solid",
    thick: "2px solid",
  },

  shadows: {
    xs: "0 1px 2px rgba(16,24,40,.04)",
    sm: "0 1px 4px rgba(16,24,40,.06)",
    md: "0 4px 12px rgba(16,24,40,.08)",
    lg: "0 8px 20px rgba(16,24,40,.10)",
    xl: "0 16px 32px rgba(16,24,40,.12)",
    form: "0 6px 18px rgba(16,24,40,.06)",
    button: "0 2px 8px rgba(16,24,40,.06)",
  },

  transition: {
    fast: "0.15s ease",
    normal: "0.25s ease",
    slow: "0.45s ease",
  },

  durations: {
    fast: "150ms",
    normal: "250ms",
    slow: "450ms",
  },

  layout: {
    // ekran görüntüsündeki genişliğe daha yakın
    containerWidth: "1120px",
    sectionspacings: "2.25rem",
  },

  zIndex: {
    dropdown: 1000,
    modal: 1100,
    overlay: 1200,
    tooltip: 1300,
  },

  opacity: {
    disabled: 0.5,
    hover: 0.9,
  },

  /* ---------- Breakpoints / Media ---------- */
  breakpoints: {
    mobileS: "320px",
    mobileM: "375px",
    mobileL: "425px",
    tabletS: "600px",
    tablet: "768px",
    laptopS: "900px",
    laptop: "1024px",
    desktop: "1280px",
    desktopL: "1440px",
  },

  media: {
    xsmall: "@media (max-width: 480px)",
    small: "@media (max-width: 768px)",
    medium: "@media (max-width: 1024px)",
    large: "@media (max-width: 1280px)",
    xlarge: "@media (min-width: 1441px)",
    mobile: "@media (max-width: 768px)",
    tablet: "@media (min-width: 769px) and (max-width: 1024px)",
    desktop: "@media (min-width: 1025px)",
    landscape: "@media (orientation: landscape)",
    portrait: "@media (orientation: portrait)",
    retina:
      "@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
  },

  /* ---------- Colors (ana sayfa görseline göre) ---------- */
  colors: {
    // sayfa zemini ve yüzeyler
    background: "#f3f5f9",
    backgroundSecondary: "#eef1f6",
    backgroundAlt: "#ffffff",
    sectionBackground: "#ffffff",
    contentBackground: "#ffffff",

    // inputlar
    inputBackground: "#ffffff",
    inputBackgroundFocus: "#fafbff",

    // alt alan / footer
    footerBackground: "#1f2329",

    // uyarı / başarı arkaplanları (soft)
    warningBackground: "#fff6e5",
    successBg: "#e9f7ef",
    dangerBg: "#ffe9ea",

    // özel “achievement” arka plan/gradient (istenmişti, aynı kaldı)
    achievementBackground: "#eef3fb",
    achievementGradientStart: "#7aa0d6",
    achievementGradientEnd: "#486289",

    // overlay & skeleton
    overlayStart: "rgba(255,255,255,0.35)",
    overlayEnd: "rgba(255,255,255,0.95)",
    overlayBackground: "rgba(0,0,0,0.45)",
    skeleton: "#f0f3f7",
    skeletonBackground: "#e7ebf2",

    // metin
    text: "#1f2430",
    textAlt: "#2b3340",
    textSecondary: "#6b7688",
    textPrimary: "#1f2430",
    textMuted: "#98a0ae",
    textLight: "#323949",
    title: "#2b3340",
    textOnWarning: "#8a4b00",
    textOnSuccess: "#0e6b3f",
    textOnDanger: "#7a0920",

    // marka & aksiyon renkleri
    primary: "#ff6b2c",                 // turuncu CTA (Yapay Zeka ile Tarif Oluştur)
    primaryLight: "#ffe6d8",
    primaryHover: "#e95f25",
    primaryDark: "#b84714",
    primaryTransparent: "rgba(255,107,44,0.12)",

    secondary: "#2d6cdf",              // mavi CTA (Yemek Tarifi Gönder)
    secondaryLight: "#e4edff",
    secondaryHover: "#1f54a8",
    secondaryDark: "#153a77",
    secondaryTransparent: "rgba(45,108,223,0.14)",

    accent: "#2d6cdf",                 // link/mavi ton
    accentHover: "#1f54a8",
    accentText: "#ffffff",

    // sınırlar / kartlar
    border: "#d8dee8",
    borderLight: "#eef1f6",
    borderBright: "#e7ebf2",
    borderBrighter: "#f7f9fc",
    borderHighlight: "#b6c3e1",
    borderInput: "#cfd6e3",

    card: "#ffffff",
    cardBackground: "#ffffff",

    // buton (varsayılanlar)
    buttonBackground: "#ff6b2c",
    buttonText: "#ffffff",
    buttonBorder: "#ff6b2c",

    // linkler
    link: "#2d6cdf",
    linkHover: "#1f54a8",

    hoverBackground: "#f1f3f7",
    shadowHighlight: "0 0 0 3px rgba(45,108,223,0.18)",

    // durum renkleri
    success: "#18a957",
    warning: "#f5a524",
    warningHover: "#d9901e",
    danger: "#e5484d",
    dangerHover: "#c53d43",
    error: "#e5484d",
    info: "#3e7bfa",
    muted: "#6c757d",
    disabled: "#d6dbe5",

    // placeholder & input yardımcıları
    placeholder: "#9aa3b2",
    inputBorder: "#cfd6e3",
    inputBorderFocus: "#2d6cdf",
    inputOutline: "#2d6cdf",
    inputIcon: "#6e7fa3",
    inputBackgroundLight: "#f7f9fc",
    inputBackgroundSofter: "#f2f5fb",

    // tablo/etiket yardımcıları
    tableHeader: "#f3f6fb",
    tagBackground: "#f1f3f7",

    // gri tonlar
    grey: "#98a0ae",
    darkGrey: "#1f2329",
    black: "#000000",
    white: "#ffffff",
    whiteColor: "#ffffff",
    darkColor: "#000000",
    disabledBg: "#e9edf3",
    lightGrey: "#f7f9fc",
  },

  /* ---------- Button / Input / Card Presets ---------- */
  buttons: {
    primary: {
      background: "#ff6b2c",
      backgroundHover: "#e95f25",
      text: "#ffffff",
      textHover: "#ffffff",
    },
    secondary: {
      background: "#2d6cdf",
      backgroundHover: "#1f54a8",
      text: "#ffffff",
      textHover: "#ffffff",
    },
    success: {
      background: "#18a957",
      backgroundHover: "#128146",
      text: "#ffffff",
      textHover: "#ffffff",
    },
    warning: {
      background: "#f5a524",
      backgroundHover: "#d9901e",
      text: "#ffffff",
      textHover: "#ffffff",
    },
    danger: {
      background: "#e5484d",
      backgroundHover: "#c53d43",
      text: "#ffffff",
      textHover: "#ffffff",
    },
  },

  inputs: {
    background: "#ffffff",
    border: "#cfd6e3",
    borderFocus: "#2d6cdf",
    text: "#1f2430",
    placeholder: "#9aa3b2",
  },

  cards: {
    background: "#ffffff",
    hoverBackground: "#f7f9fc",
    border: "#e7ebf2",
    shadow: "0 8px 24px rgba(16,24,40,.06)",
  },
};

export default classicTheme;
