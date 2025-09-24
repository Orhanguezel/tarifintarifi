// src/features/page/PageFactory.tsx
import BreadcrumbJsonLd from "@/features/seo/BreadcrumbJsonLd";

type Crumb = { name: string; url: string };

export function SectionScaffold({
  h1, intro, children, breadcrumbs,
}: {
  h1: string;
  intro?: string;
  children?: React.ReactNode;
  breadcrumbs: Crumb[];
}) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <main style={{maxWidth: 1120, margin: "24px auto 48px", padding: "0 20px"}}>
        <header style={{
          background: "#fff", border: "1px solid #e7ebf2", borderRadius: 16, padding: "24px 20px", marginBottom: 18
        }}>
          <h1 style={{margin: "0 0 8px 0", fontSize: "2rem"}}>{h1}</h1>
          {intro ? (
            <p style={{margin: 0, color: "#6b7688"}}>{intro}</p>
          ) : null}
        </header>
        {children}
      </main>
    </>
  );
}
