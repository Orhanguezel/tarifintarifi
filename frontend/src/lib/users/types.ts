export type UserRole = "admin" | "editor" | "viewer";

export interface Me {
  _id: string;
  email: string;
  role: UserRole;
}

export interface LoginResult {
  email: string;
  role: UserRole;
  /** BE login response’unda dönüyorsun */
  at?: string;
  csrf?: string;
}

export interface RegisterResult {
  id: string;
  email: string;
  role: UserRole;
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};
