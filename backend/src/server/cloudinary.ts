// src/server/cloudinary.ts
import { v2 as _cloudinary } from "cloudinary";

const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; // son çare, client değil

if (!cloud_name) {
  // İstersen throw yerine warn atabilirsin
  console.warn("[cloudinary] CLOUDINARY_CLOUD_NAME yok!");
}

_cloudinary.config({
  cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinary = _cloudinary; // tek kaynak
