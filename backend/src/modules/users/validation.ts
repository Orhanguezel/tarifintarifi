import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
});

export const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "editor", "viewer"]).default("admin")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6).max(128),
  newPassword: z.string().min(8).max(128),
  confirmNewPassword: z.string().min(8).max(128)
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "PASSWORD_MISMATCH",
  path: ["confirmNewPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
