// src/modules/blog/public/components/BlogReactions.tsx
"use client";

import ReactionsBar from "@/modules/reactions/public/components/ReactionsBar";

type Props = { blogId: string };

export default function BlogReactions({ blogId }: Props) {
  return (
    <ReactionsBar
      targetType="post"     // 🔴 blog için "post" kullan
      targetId={blogId}
      size="md"
    // labels={{ like: "Beğen", favorite: "Favori", bookmark: "Kaydet", rate: "Puan ver" }}
    />
  );
}
