// src/app/[locale]/(admin)/admin/layout.tsx
import type { ReactNode } from "react";
import { getMessages, setRequestLocale } from "next-intl/server";
import IntlProviderClient from "@/i18n/IntlProviderClient";
import Providers from "@/app/providers";
import type { SupportedLocale } from "@/types/common";
import AdminFrame from "./AdminFrame";

export default async function AdminLayout({
  children,
  params: paramsPromise,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // ⬇️ params'ı burada await ediyoruz
  const { locale } = await paramsPromise;
  const loc = (locale as SupportedLocale) || "tr";

  setRequestLocale(loc);
  const messages = await getMessages();

  return (
    <Providers locale={loc}>
      <IntlProviderClient locale={loc} messages={messages}>
        <AdminFrame>{children}</AdminFrame>
      </IntlProviderClient>
    </Providers>
  );
}
