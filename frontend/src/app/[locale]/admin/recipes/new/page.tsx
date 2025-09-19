// src/app/[locale]/admin/recipes/new/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import RecipeForm from "@/components/admin/recipes/RecipeForm";

export default function AdminRecipeNewPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  return (
    <RecipeForm
      mode="create"
      initial={null}
      onDone={() => router.replace(`/${locale}/admin/recipes`)}
      onCancel={() => router.back()}
    />
  );
}
