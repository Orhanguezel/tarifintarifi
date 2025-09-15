import { Schema, model, models, type Model } from "mongoose";
import type { IComment } from "./types";

const CommentSchema = new Schema<IComment>(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: "recipe", required: true, index: true },

    userId: { type: Schema.Types.ObjectId, required: false, index: true },
    name: {
      type: String,
      trim: true,
      required: function () { return !this.userId; },
    },
    email: {
      type: String,
      trim: true,
      required: function () { return !this.userId; },
    },
    profileImage: { type: Schema.Types.Mixed },

    text: { type: String, trim: true, required: true },

    // Anti-spam meta
    ipHash:    { type: String, index: true },
    userAgent: { type: String },
    riskScore: { type: Number, min: 0, max: 1, default: 0 },

    isPublished: { type: Boolean, default: true, index: true },
    isActive:    { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

/* Public liste performansı için */
CommentSchema.index(
  { recipeId: 1, isActive: 1, isPublished: 1, createdAt: -1 },
  { name: "idx_recipe_public_comments" }
);

// Flood kontrolüne yardımcı ek indexler:
CommentSchema.index({ recipeId: 1, userId: 1, createdAt: -1 }, { name: "idx_recipe_user_recent" });
CommentSchema.index({ recipeId: 1, ipHash: 1, createdAt: -1 }, { name: "idx_recipe_ip_recent" });

export const Comment: Model<IComment> =
  (models.comment as Model<IComment>) || model<IComment>("comment", CommentSchema);
