"use client";

import * as React from "react";
import {NextIntlClientProvider} from "next-intl";

type Props = {
  locale: string;
  messages: Record<string, any>;
  children: React.ReactNode;
};

export default function IntlProviderClient({locale, messages, children}: Props) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={(err: any) => {
        if (err?.code === "MISSING_MESSAGE") return;
        // İstersen burada logla
        // console.error(err);
      }}
      getMessageFallback={({key, namespace}) =>
        (namespace ? `${namespace}.` : "") + key
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}
