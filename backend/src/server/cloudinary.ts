// src/server/cloudinary.ts
import { v2 as _cloudinary } from "cloudinary";

/**
 * Server-side Cloudinary config — tek kaynak.
 * Not: İstemci için herhangi bir public key export etmiyoruz.
 */
const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; // (son çare) ama server'da beklenen: CLOUDINARY_CLOUD_NAME

if (!cloud_name) {
  console.warn("[cloudinary] CLOUDINARY_CLOUD_NAME tanımlı değil!");
}

_cloudinary.config({
  cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinary = _cloudinary;
