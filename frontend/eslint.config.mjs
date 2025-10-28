// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Eski "extends" tabanlı konfigleri flat dünyaya çevirir
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Build çıktıları ve bağımlılıkları lint dışı bırak
  { ignores: ["node_modules/**", ".next/**", "dist/**", "coverage/**"] },

  // Next + TS kural setleri (eski extends → flat)
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Genel ortam/globals
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        // Monorepo veya farklı çalışma dizinlerinde TS'i doğru bağlamak için
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
    },
  },

  // Test dosyaları için (Vitest) globals
  {
    files: ["**/*.spec.{ts,tsx}", "**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest/JSDOM global’leri
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      // Testing-library ile çalışırken bazen gerekli olabiliyor
      "react/jsx-key": "off",
    },
  },

  // Proje özel kuralların
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
