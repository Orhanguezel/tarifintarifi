import type { DefaultTheme } from "styled-components";

/** BE token şeması serbest — sade bir dönüştürücü bırakıyoruz */
export function tokensToTheme(tokens: Record<string, any>): Partial<DefaultTheme> {
  const t = tokens || {};

  // Örnek basit map: BE `colors.primary` → theme.colors.primary
  const colors = t.colors ? { colors: { ...t.colors } } : {};
  const fonts =
    t.fonts || t.font
      ? { fonts: { ...(t.fonts || t.font) } }
      : {};
  const fontSizes = t.fontSizes || t.font?.size ? { fontSizes: { ...(t.fontSizes || t.font?.size) } } : {};
  const radii = t.radii || t.radius ? { radii: { ...(t.radii || t.radius) } } : {};
  const spacings = t.spacing || t.spacings ? { spacings: { ...(t.spacing || t.spacings) } } : {};

  // İstediğin alanları zamanla genişlet
  return {
    ...colors,
    ...fonts,
    ...fontSizes,
    ...radii,
    ...spacings,
  } as Partial<DefaultTheme>;
}
