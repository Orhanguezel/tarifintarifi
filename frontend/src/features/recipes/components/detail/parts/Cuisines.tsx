import { ChipLink, Row } from "../shared/primitives";

export default function Cuisines({ cuisines, locale }: { cuisines: string[]; locale: string; }) {
  return (
    <Row aria-label="cuisine">
      {cuisines.map((c) => (
        <ChipLink key={c} href={`/${locale}?q=${encodeURIComponent(c)}`}>🍽️ {c}</ChipLink>
      ))}
    </Row>
  );
}
