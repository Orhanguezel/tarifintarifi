import { HeroImg } from "../shared/primitives";
export default function Hero({ src, alt }: { src: string; alt: string }) {
  return <HeroImg src={src} alt={alt} loading="eager" />;
}
