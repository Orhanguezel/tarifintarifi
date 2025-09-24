// helpers/intl.ts (istersen dosyaya çıkar)
import { getTranslations } from "next-intl/server";

export async function safeGetT(locale: string, primaryNs: string, fallbackNs?: string) {
  try {
    return await getTranslations({ locale, namespace: primaryNs });
  } catch {
    if (fallbackNs) {
      try {
        return await getTranslations({ locale, namespace: fallbackNs });
      } catch {
        /* fall through */
      }
    }
    // Son çare: anahtarı kendisi dönen noop t
    return ((key: string, vars?: any) => key) as unknown as Awaited<ReturnType<typeof getTranslations>>;
  }
}
