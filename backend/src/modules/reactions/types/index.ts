import type { Types, Document } from "mongoose";

/** Kullanılabilir tepki türleri */
export type ReactionKind = "LIKE" | "FAVORITE" | "BOOKMARK" | "EMOJI" | "RATING";

/** Sadece recipe'a tepki */
export interface IReaction extends Document {
  user: Types.ObjectId;          // misafir veya login kullanıcı id (cookie ile üretilebilir)

  kind: ReactionKind;
  /** kind === "EMOJI" ise zorunlu; diğer türlerde null */
  emoji?: string | null;

  /** kind === "RATING" ise 1..5 arası zorunlu; diğerlerinde null */
  value?: number | null;

  /** Hedef: recipe */
  recipeId: Types.ObjectId;

  /** Gevşek metadata (kaynak, cihaz, ip vb. için) */
  extra?: Record<string, unknown>;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
