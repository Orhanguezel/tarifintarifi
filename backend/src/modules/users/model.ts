// src/modules/users/model.ts
import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "editor", "viewer"], default: "admin", index: true },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof userSchema>;
export const UserModel = model<IUser>("User", userSchema);
