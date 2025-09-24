import React from "react";
import type { SupportedLocale } from "@/types/common";
import { siteUrlBase, absoluteUrl, compact } from "./utils";

export default function SiteJsonLd({ locale }: { locale: SupportedLocale }) {
  const base = siteUrlBase();
  const name = (process.env.NEXT_PUBLIC_SITE_NAME || "ensotek.de").trim();
  const logo = absoluteUrl("/logo.png");

  // Şirket açıklaması (TEST Organization.description>10 bekliyor)
  const orgDescription =
    (process.env.NEXT_PUBLIC_ORG_DESCRIPTION ||
      "Ensotek – Industrial solutions & services.").trim();

  const rawSameAs = (process.env.NEXT_PUBLIC_ORG_SAMEAS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // sadece http/https ile başlayanları al
  const sameAs = rawSameAs.filter(u => /^https?:\/\//i.test(u));

  const contactPoint = compact({
    "@type": "ContactPoint",
    telephone: (process.env.NEXT_PUBLIC_ORG_CONTACT_TELEPHONE || "").trim() || undefined,
    contactType: (process.env.NEXT_PUBLIC_ORG_CONTACT_TYPE || "customer support").trim(),
    areaServed: (process.env.NEXT_PUBLIC_ORG_CONTACT_AREA || "").trim() || undefined,
    availableLanguage: (process.env.NEXT_PUBLIC_ORG_CONTACT_LANGS || locale)
      .split(",").map(s => s.trim()),
  });
  if (!contactPoint.telephone) delete (contactPoint as any).telephone;

  const data = [
    compact({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: `${base}/`,
      name,
      inLanguage: locale,
      publisher: { "@id": `${base}#organization` },
      potentialAction: compact({
        "@type": "SearchAction",
        target: `${base}/${locale}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      }),
    }),
    compact({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}#organization`,
      url: `${base}/`,
      name,
      description: orgDescription,          // ⇐ eklendi
      logo: { "@type": "ImageObject", url: logo },
      ...(sameAs.length ? { sameAs } : {}),
      ...(Object.keys(contactPoint).length ? { contactPoint: [contactPoint] } : {}),
    }),
  ];

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
