import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GAScripts() {
  if (!GA_ID) return null;

  const isProd = process.env.NODE_ENV === "production";

  return (
    <>
      {/* (Opsiyonel) Consent Mode default - EEA için önerilir */}
      <Script id="ga-consent" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      {/* GA kaynak dosyası */}
      <Script
        id="ga-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* dataLayer + config (send_page_view:false -> SPA'de manuel göndereceğiz) */}
      <Script id="ga-base" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            send_page_view: false
          });

          // (Opsiyonel) Sonradan onay verilince çağırabilmeniz için:
          window.__grantAnalyticsConsent = function(){
            gtag('consent', 'update', { analytics_storage: 'granted' });
          };
        `}
      </Script>
    </>
  );
}
