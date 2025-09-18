// src/test/setup.ts
import "@testing-library/jest-dom/vitest";

// Basit polyfill'ler (gerekirse)
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });
