import argon2 from "argon2";
import { UserModel } from "./model";

export async function hashPassword(pw: string) {
  return argon2.hash(pw);
}
export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw);
}
export async function findActiveByEmail(email: string) {
  return UserModel.findOne({ email: email.toLowerCase(), active: true }).lean();
}
