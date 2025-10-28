import { CardBox, SectionTitle, Ul } from "../../shared/primitives";
export default function TipsCard({ tRD, items }: { tRD: any; items: string[] }) {
  return (
    <CardBox>
      <SectionTitle>{tRD("sections.tips", { default: "Püf Noktaları" })}</SectionTitle>
      <Ul>{items.map((tx, i) => <li key={i}>{tx}</li>)}</Ul>
    </CardBox>
  );
}
