// eslint.config.js (veya .mjs)
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Build çıktıları ve bağımlılıkları lint dışı bırak
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },

  // Next'in eski (extends) konfiglerini flat dünyaya çevir
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Proje özel kuralların
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/jsx-key": "off",
    },
  },
];
