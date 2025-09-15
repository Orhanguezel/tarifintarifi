import { CardBox, AsideTitle, Table } from "../../shared/primitives";

export default function NutritionCard({ tRD, nutrition }: { tRD: any; nutrition: any }) {
  return (
    <CardBox>
      <AsideTitle>{tRD("sections.nutrition")}</AsideTitle>
      <Table>
        <tbody>
          {nutrition.calories !== undefined && (<tr><th>{tRD("table.calories")}</th><td>{nutrition.calories} kcal</td></tr>)}
          {nutrition.protein  !== undefined && (<tr><th>{tRD("table.protein")}</th><td>{nutrition.protein} g</td></tr>)}
          {nutrition.carbs    !== undefined && (<tr><th>{tRD("table.carbs")}</th><td>{nutrition.carbs} g</td></tr>)}
          {nutrition.fat      !== undefined && (<tr><th>{tRD("table.fat")}</th><td>{nutrition.fat} g</td></tr>)}
          {nutrition.fiber    !== undefined && (<tr><th>{tRD("table.fiber")}</th><td>{nutrition.fiber} g</td></tr>)}
          {nutrition.sodium   !== undefined && (<tr><th>{tRD("table.sodium")}</th><td>{nutrition.sodium} mg</td></tr>)}
        </tbody>
      </Table>
    </CardBox>
  );
}
