// src/features/recipes/components/detail/parts/cards/CommentsCard.tsx
import { CardBox, SectionTitle } from "../../shared/primitives";
import CommentList from "@/features/comments/CommentList";
import CommentForm from "@/features/comments/CommentForm";
import { useTranslations } from "next-intl";

export default function CommentsCard({ recipeId }: { recipeId: string }) {
  const tComments = useTranslations("comments");
  return (
    <CardBox>
      <SectionTitle style={{ marginTop: 0 }}>
        {tComments("title")}
      </SectionTitle>
      <CommentList recipeId={recipeId} />
      {/* CommentForm locale istemiyor; TS hatası buradan geliyordu */}
      <CommentForm recipeId={recipeId} />
    </CardBox>
  );
}
