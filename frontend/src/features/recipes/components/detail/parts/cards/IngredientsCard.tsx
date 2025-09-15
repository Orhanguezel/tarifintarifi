import { CardBox, SectionTitle, Ul } from "../../shared/primitives";
export default function IngredientsCard({ tRD, items }: { tRD: any; items: string[] }) {
  return (
    <CardBox>
      <SectionTitle>{tRD("sections.ingredients")}</SectionTitle>
      <Ul>{items.map((line, i) => <li key={i}>{line}</li>)}</Ul>
    </CardBox>
  );
}
