import { Schema, model, models, type Model, Types } from "mongoose";
import type { IReaction, ReactionKind } from "./types";

const ReactionSchema = new Schema<IReaction>(
  {
    user:   { type: Schema.Types.ObjectId, required: true, index: true },

    kind: {
      type: String,
      required: true,
      enum: ["LIKE", "FAVORITE", "BOOKMARK", "EMOJI", "RATING"] as ReactionKind[],
      index: true,
    },

    emoji: { type: String, trim: true, default: null },        // sadece EMOJI

    value: { type: Number, min: 1, max: 5, default: null },    // sadece RATING

    recipeId: { type: Schema.Types.ObjectId, ref: "recipe", required: true, index: true },

    extra:    { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, minimize: false }
);

/* ----- Indexes ----- */
// Kullanıcı aynı tarife aynı tür (ve EMOJI ise aynı emoji) en fazla 1 kayıt.
ReactionSchema.index(
  { user: 1, recipeId: 1, kind: 1, emoji: 1 },
  { unique: true, name: "uniq_user_recipe_kind_emoji" }
);

// Özet/rapor sorguları için yardımcı
ReactionSchema.index({ recipeId: 1, kind: 1, emoji: 1, value: 1 }, { name: "summary_idx" });

/* ----- Hooks / Validations ----- */
ReactionSchema.pre("validate", function (next) {
  if (this.kind === "EMOJI") {
    if (!this.emoji || String(this.emoji).trim().length === 0) {
      return next(new Error("emoji_required_for_kind_emoji"));
    }
    this.value = null;
  } else if (this.kind === "RATING") {
    this.emoji = null;
    const v = Number(this.value);
    if (!(Number.isFinite(v) && v >= 1 && v <= 5)) {
      return next(new Error("rating_value_out_of_range"));
    }
    this.value = v;
  } else {
    this.emoji = null;
    this.value = null;
  }
  next();
});

export const Reaction: Model<IReaction> =
  (models.reaction as Model<IReaction>) || model<IReaction>("reaction", ReactionSchema);
