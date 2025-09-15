// src/styles/styled.d.ts
import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    templateName: string;

    fonts: {
      main: string;
      special: string;
      heading: string;
      body: string;
      mono: string;
    };

    fontSizes: {
      base: string;
      xsmall: string;
      small: string;
      medium: string;
      large: string;
      xlarge: string;
      h1: string;
      h2: string;
      h3: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
    };

    fontWeights: {
      thin: number;
      light: number;
      regular: number;
      medium: number;
      semiBold: number;
      bold: number;
      extraBold: number;
    };

    lineHeights: {
      normal: string;
      relaxed: string;
      loose: string;
    };

    spacings: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };

    radii: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      pill: string;
      circle: string;
    };

    borders: {
      thin: string;
      thick: string;
    };

    shadows: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      form: string;
      button: string;
    };

    transition: {
      fast: string;
      normal: string;
      slow: string;
    };

    durations: {
      fast: string;
      normal: string;
      slow: string;
    };

    layout: {
      containerWidth: string;
      sectionspacings: string;
    };

    zIndex: {
      dropdown: number;
      modal: number;
      overlay: number;
      tooltip: number;
    };

    opacity: {
      disabled: number;
      hover: number;
    };

    breakpoints: {
      mobileS: string;
      mobileM: string;
      mobileL: string;
      tabletS: string;
      tablet: string;
      laptopS: string;
      laptop: string;
      desktop: string;
      desktopL: string;
    };

    media: {
      xsmall: string;
      small: string;
      medium: string;
      large: string;
      xlarge: string;
      mobile: string;
      tablet: string;
      desktop: string;
      landscape: string;
      portrait: string;
      retina: string;
    };

    colors: {
      background: string;
      backgroundSecondary: string;
      backgroundAlt: string;
      sectionBackground: string;
      inputBackground: string;
      inputBackgroundFocus: string;
      footerBackground: string;
      warningBackground: string;
      contentBackground: string;
      achievementBackground: string;
      achievementGradientStart: string;
      achievementGradientEnd: string;
      successBg: string;
      dangerBg: string;
      text: string;
      textAlt: string;
      textSecondary: string;
      textPrimary: string;
      textMuted: string;
      textLight: string;
      textOnWarning: string;
      textOnSuccess: string;
      textOnDanger: string;
      title: string;
      overlayStart: string;
      overlayEnd: string;
      overlayBackground: string;
      skeleton: string;
      skeletonBackground: string;
      primary: string;
      primaryLight: string;
      primaryHover: string;
      primaryDark: string;
      primaryTransparent: string;
      secondary: string;
      secondaryLight: string;
      secondaryHover: string;
      secondaryDark: string;
      secondaryTransparent: string;
      accent: string;
      accentHover: string;
      accentText: string;
      border: string;
      borderLight: string;
      borderBright: string;
      borderBrighter: string;
      borderHighlight: string;
      borderInput: string;
      card: string;
      cardBackground: string;
      buttonBackground: string;
      buttonText: string;
      buttonBorder: string;
      link: string;
      linkHover: string;
      hoverBackground: string;
      shadowHighlight: string;
      success: string;
      warning: string;
      warningHover: string;
      danger: string;
      dangerHover: string;
      error: string;
      info: string;
      muted: string;
      disabled: string;
      placeholder: string;
      inputBorder: string;
      inputBorderFocus: string;
      inputOutline: string;
      inputIcon: string;
      inputBackgroundLight: string;
      inputBackgroundSofter: string;
      tableHeader: string;
      tagBackground: string;
      grey: string;
      darkGrey: string;
      black: string;
      white: string;
      whiteColor: string;
      darkColor: string;
      disabledBg: string;
      lightGrey: string;
    };

    buttons: {
      primary: {
        background: string;
        backgroundHover: string;
        text: string;
        textHover: string;
      };
      secondary: {
        background: string;
        backgroundHover: string;
        text: string;
        textHover: string;
      };
      success: {
        background: string;
        backgroundHover: string;
        text: string;
        textHover: string;
      };
      warning: {
        background: string;
        backgroundHover: string;
        text: string;
        textHover: string;
      };
      danger: {
        background: string;
        backgroundHover: string;
        text: string;
        textHover: string;
      };
    };

    inputs: {
      background: string;
      border: string;
      borderFocus: string;
      text: string;
      placeholder: string;
    };

    cards: {
      background: string;
      hoverBackground: string;
      border: string;
      shadow: string;
    };
  }
}
