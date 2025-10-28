// src/app/[locale]/admin/recipes/[id]/edit/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import RecipeForm from "@/components/admin/recipes/RecipeForm";
import { useAdminGetRecipeQuery } from "@/lib/recipes/api.client";

export default function AdminRecipeEditPage() {
  const router = useRouter();
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const { data, isLoading } = useAdminGetRecipeQuery(id);

  if (isLoading) return <p>Yükleniyor…</p>;
  if (!data) return <p>Bulunamadı</p>;

  return (
    <RecipeForm
      mode="edit"
      initial={data}
      onDone={() => router.replace(`/${locale}/admin/recipes`)}
      onCancel={() => router.back()}
    />
  );
}
