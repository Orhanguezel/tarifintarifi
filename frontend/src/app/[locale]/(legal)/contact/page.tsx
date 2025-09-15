// app/[locale]/(legal)/contact/page.tsx
import { getTranslations } from "next-intl/server";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 86400;

type Params = { locale: SupportedLocale };

// .env'den e-posta oku (+ güvenli fallback)
const CONTACT_EMAIL =
  (process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.CONTACT_EMAIL || "hello@tarifintarifi.com").trim();

export default async function ContactPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params; // ⬅️ önemli
  const t = await getTranslations({ locale, namespace: "legal.contact" });

  return (
    <main style={{ maxWidth: 860, margin: "28px auto", padding: "0 16px" }}>
      <h1>{t("title")}</h1>
      <p>{t("desc")}</p>
      <ul>
        <li>
          {t("email")}:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} rel="noopener noreferrer">
            {CONTACT_EMAIL}
          </a>
        </li>
        <li>
          {t("address")}: {t("addressText")}
        </li>
      </ul>
    </main>
  );
}
