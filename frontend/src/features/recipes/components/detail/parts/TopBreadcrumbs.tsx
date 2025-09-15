"use client";

import { useTranslations } from "next-intl";
import { TopRow, Crumbs, Crumb, CrumbSep, Current, PrintLink } from "../shared/primitives";

export default function TopBreadcrumbs({
  locale,
  categoryKey,
  categoryLabel,
  title,
}: {
  locale: string;
  categoryKey?: string | null;
  categoryLabel?: string;
  title: string;
}) {
  const tNav = useTranslations("nav");
  const tRD = useTranslations("recipeDetail");

  const hasCat = !!(categoryKey && String(categoryKey).trim());

  return (
    <TopRow>
      <Crumbs>
        <Crumb href={`/${locale}`}>↩ {tNav("home")}</Crumb>

        {hasCat && (
          <>
            <CrumbSep> / </CrumbSep>
            <Crumb
              href={`/${locale}?cat=${encodeURIComponent(String(categoryKey))}`}
              aria-label={categoryLabel || undefined}
              title={categoryLabel || undefined}
            >
              {categoryLabel || String(categoryKey)}
            </Crumb>
          </>
        )}

        <CrumbSep> / </CrumbSep>
        <Current>{title}</Current>
      </Crumbs>

      <PrintLink type="button" onClick={() => window.print()}>
        🖨️ {tRD("print")}
      </PrintLink>
    </TopRow>
  );
}
