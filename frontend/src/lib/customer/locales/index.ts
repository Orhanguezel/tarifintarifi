import tr from "./tr.json";
import en from "./en.json";
import de from "./de.json";
import fr from "./fr.json";
import es from "./es.json";
import pl from "./pl.json";
import type { SupportedLocale } from "@/types/common";

const translations: Record<SupportedLocale, any> = { tr, en, de, fr, es, pl };
export default translations;
