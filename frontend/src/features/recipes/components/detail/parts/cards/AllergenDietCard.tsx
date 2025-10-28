import { CardBox, AsideTitle, Badges, BadgePill, Icon, Note } from "../../shared/primitives";
import type { Recipe, AllergenFlag } from "@/lib/recipes/types";
import { useTranslations } from "next-intl";
import { ALLERGEN_ICON, DIET_ICON_POS, DIET_ICON_NEG } from "../../shared/constants";

export default function AllergenDietCard({ data, locale }: { data: Recipe; locale: string; }) {
  const tRD = useTranslations("recipeDetail");
  const allergenFlags = new Set(data.allergenFlags || []);
  const dietFlags = new Set(data.dietFlags || []);

  const isVegetarian = dietFlags.has("vegetarian");
  const isVegan = dietFlags.has("vegan");
  const isGlutenFree = dietFlags.has("gluten-free");
  const isLactoseFree = dietFlags.has("lactose-free");

  if (allergenFlags.size === 0 && dietFlags.size === 0) return null;

  return (
    <CardBox>
      <AsideTitle>{tRD("sections.allergenDiet")}</AsideTitle>
      <Badges>
        {(["gluten", "dairy", "egg", "nuts", "peanut", "soy", "sesame", "fish", "shellfish"] as AllergenFlag[])
          .filter((f) => allergenFlags.has(f))
          .map((f) => (
            <BadgePill key={f} data-variant={f === "gluten" ? "warn" : "neutral"} title={tRD(`allergens.${f}Contains`, { default: "" })}>
              <Icon aria-hidden>{ALLERGEN_ICON[f]}</Icon>
              {tRD(`allergens.${f}Contains`, {
                default:
                  f === "gluten" ? "Gluten içerir" :
                    f === "dairy" ? "Süt ürünü içerir" :
                      f === "egg" ? "Yumurta içerir" :
                        f === "nuts" ? "Kuruyemiş içerir" :
                          f === "peanut" ? "Yer fıstığı içerir" :
                            f === "soy" ? "Soya içerir" :
                              f === "sesame" ? "Susam içerir" :
                                f === "fish" ? "Balık içerir" :
                                  "Kabuklu deniz ürünü içerir"
              })}
            </BadgePill>
          ))}

        {/* Diyet: net evet/hayır */}
        <BadgePill data-variant={isVegetarian ? "ok" : "danger"}>
          <Icon aria-hidden>{(isVegetarian ? DIET_ICON_POS : DIET_ICON_NEG)["vegetarian"]}</Icon>
          {isVegetarian ? tRD("diet.vegetarianOk", { default: "Vejetaryen" }) : tRD("diet.vegetarianNo", { default: "Vejetaryen değildir" })}
        </BadgePill>

        <BadgePill data-variant={isVegan ? "ok" : "danger"}>
          <Icon aria-hidden>{(isVegan ? DIET_ICON_POS : DIET_ICON_NEG)["vegan"]}</Icon>
          {isVegan ? tRD("diet.veganOk", { default: "Vegan" }) : tRD("diet.veganNo", { default: "Vegan değildir" })}
        </BadgePill>

        <BadgePill data-variant={isGlutenFree ? "ok" : "danger"}>
          <Icon aria-hidden>{(isGlutenFree ? DIET_ICON_POS : DIET_ICON_NEG)["gluten-free"]}</Icon>
          {isGlutenFree ? tRD("diet.glutenFreeOk", { default: "Glütensiz" }) : tRD("diet.glutenFreeNo", { default: "Gluten içerir" })}
        </BadgePill>

        <BadgePill data-variant={isLactoseFree ? "ok" : "danger"}>
          <Icon aria-hidden>{(isLactoseFree ? DIET_ICON_POS : DIET_ICON_NEG)["lactose-free"]}</Icon>
          {isLactoseFree ? tRD("diet.lactoseFreeOk", { default: "Laktozsuz" }) : tRD("diet.lactoseFreeNo", { default: "Laktoz içerir" })}
        </BadgePill>
      </Badges>

      <Note style={{ marginTop: 8 }}>{tRD("sections.note")}</Note>
    </CardBox>
  );
}
