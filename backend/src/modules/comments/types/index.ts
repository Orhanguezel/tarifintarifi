import type { Types, Document } from "mongoose";

export interface IComment extends Document {
  // Hedef
  recipeId: Types.ObjectId;

  // Kullanıcı: login ya da misafir (cookie ile ObjectId)
  userId?: Types.ObjectId;
  name?: string;
  email?: string;
  profileImage?: string | { thumbnail?: string; url?: string };

  // İçerik
  text: string;

  // Anti-spam meta (opsiyonel)
  ipHash?: string;         // salted hash of client IP
  userAgent?: string;      // UA snapshot
  riskScore?: number;      // 0..1 (ileride kullanılabilir)

  // Durumlar
  isPublished: boolean;    // moderasyon yoksa true
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
