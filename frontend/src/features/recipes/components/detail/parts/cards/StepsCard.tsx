import { CardBox, SectionTitle, Ol } from "../../shared/primitives";
export default function StepsCard({ tRD, items }: { tRD: any; items: string[] }) {
  return (
    <CardBox>
      <SectionTitle>{tRD("sections.steps")}</SectionTitle>
      <Ol>{items.map((s, i) => <li key={i}>{s}</li>)}</Ol>
    </CardBox>
  );
}
