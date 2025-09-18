// src/features/seo/tests/RecipeJsonLd.spec.tsx
/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import React from "react";
import RecipeJsonLd from "../../../features/recipes/RecipeJsonLd";

const r = {
  title: { tr: "Mercimek Çorbası" },
  slugCanonical: "mercimek-corbasi",
  images: [],
  steps: [{ title: "Hazırlık", text: "Soğanı doğra" }],
  ingredients: [{ text: "1 su bardağı mercimek" }],
  totalMinutes: 30,
  servings: 4,
} as any;

describe("RecipeJsonLd", () => {
  it("Recipe JSON-LD üretir", () => {
    const { container } = render(<RecipeJsonLd r={r} locale="tr" />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    const json = JSON.parse(script!.textContent || "{}");
    expect(json["@type"]).toBe("Recipe");
    expect(json.name).toBe("Mercimek Çorbası");
  });
});


