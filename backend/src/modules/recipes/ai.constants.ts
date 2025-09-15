///home/orhan/Dokumente/tariftarif/backend/src/modules/recipes/ai.constants.ts 
import slugify from "slugify";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type { TranslatedLabel } from "./types";

/** Canonical slug için tercih sırası */
export const PREFERRED_CANONICAL_ORDER: SupportedLocale[] = [
  "en", "tr", "fr", "de", "it", "pt", "ar", "ru", "zh", "hi",
];

/** Servis cümlesi (10 dil) */
export const SERVE_TEXT: TranslatedLabel = {
  tr: "Sıcak servis edin.",
  en: "Serve hot.",
  fr: "Servez chaud.",
  de: "Heiß servieren.",
  it: "Servite caldo.",
  pt: "Sirva quente.",
  ar: "قدّمها ساخنة.",
  ru: "Подавайте горячим.",
  zh: "趁热上桌。",
  hi: "गरमागरम परोसें।",
};

/** Servis/plating ipuçları (regex) */
export const SERVE_CUES: Record<SupportedLocale, RegExp[]> = {
  tr: [/servis\s*et/i, /servis\s*edin/i, /servise\s*sun/i],
  en: [/serve\b/i, /plate\b/i],
  fr: [/servez/i, /\bservir\b/i, /dresser/i],
  de: [/servier/i, /anricht/i],
  it: [/serv(i[rt]|ite|ire)\b/i],
  pt: [/sirv[ae]/i, /\bservir\b/i],
  ar: [/قدّم|تقديم|يُ?قدّم/i],
  ru: [/подавай|подавайте|подача|подавать/i],
  zh: [/(上桌|装盘|上菜|即可食用)/],
  hi: [/परोसें|परोसिए|परोसो/i],
};

/** Tag sözlüğü (kanonik) — yaygın örnekler */
export const TAG_CANON: Record<string, TranslatedLabel> = {
  soup: {
    tr:"çorba", en:"soup", fr:"soupe", de:"suppe", it:"zuppa", pt:"sopa",
    ar:"حساء", ru:"суп", zh:"汤", hi:"सूप"
  },
  breakfast: {
    tr:"kahvaltı", en:"breakfast", fr:"petit-déjeuner", de:"frühstück", it:"colazione", pt:"café da manhã",
    ar:"فطور", ru:"завтрак", zh:"早餐", hi:"नाश्ता"
  },
  lunch: {
    tr:"öğle", en:"lunch", fr:"déjeuner", de:"mittagessen", it:"pranzo", pt:"almoço",
    ar:"غداء", ru:"обед", zh:"午餐", hi:"दोपहर का भोजन"
  },
  dinner: {
    tr:"akşam", en:"dinner", fr:"dîner", de:"abendessen", it:"cena", pt:"jantar",
    ar:"عشاء", ru:"ужин", zh:"晚餐", hi:"रात का खाना"
  },
  dessert: {
    tr:"tatlı", en:"dessert", fr:"dessert", de:"dessert", it:"dessert", pt:"sobremesa",
    ar:"تحلية", ru:"десерт", zh:"甜点", hi:"मिठाई"
  },
  snack: {
    tr:"atıştırmalık", en:"snack", fr:"snack", de:"snack", it:"spuntino", pt:"lanche",
    ar:"وجبة خفيفة", ru:"перекус", zh:"零食", hi:"नाश्ता (स्नैक)"
  },
  drink: {
    tr:"içecek", en:"drink", fr:"boisson", de:"getränk", it:"bevanda", pt:"bebida",
    ar:"مشروب", ru:"напиток", zh:"饮品", hi:"पेय"
  },
  detox: {
    tr:"detoks", en:"detox", fr:"détox", de:"detox", it:"detox", pt:"detox",
    ar:"ديتوكس", ru:"детокс", zh:"清体", hi:"डीटॉक्स"
  },

  vegan: { tr:"vegan", en:"vegan", fr:"végane", de:"vegan", it:"vegano", pt:"vegano", ar:"نباتي", ru:"веганский", zh:"纯素", hi:"वीगन" },
  vegetarian: { tr:"vejetaryen", en:"vegetarian", fr:"végétarien", de:"vegetarisch", it:"vegetariano", pt:"vegetariano", ar:"نباتي", ru:"वегетарианский".replace("व","в").replace("य","е") as any, zh:"素食", hi:"शाकाहारी" },
  "gluten-free": { tr:"glütensiz", en:"gluten-free", fr:"sans gluten", de:"glutenfrei", it:"senza glutine", pt:"sem glúten", ar:"خالٍ من الغलوتين", ru:"без глютена", zh:"无麸质", hi:"ग्लूटेन-रहित" },
  "lactose-free": { tr:"laktozsuz", en:"lactose-free", fr:"sans lactose", de:"laktosefrei", it:"senza lattosio", pt:"sem lactose", ar:"خالٍ من اللاكتوز", ru:"без лактозы", zh:"无乳糖", hi:"लैक्टोज़-रहित" },

  turkish: { tr:"türk", en:"turkish", fr:"turc", de:"türkisch", it:"turco", pt:"turco", ar:"تركي", ru:"турецкий", zh:"土耳其", hi:"तुर्की" },
  italian: { tr:"italyan", en:"italian", fr:"italien", de:"italienisch", it:"italiano", pt:"italiano", ar:"إيطالي", ru:"итальянский", zh:"意大利", hi:"इटालियन" }
};

const stripDiacritics = (s: string) =>
  s?.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/İ/g, "I").replace(/ı/g, "i");

export const CUISINE_CANON_KEYS = new Map<string, string>([
  ["italian", "italian"], ["italien", "italian"], ["italiano", "italian"], ["italienisch", "italian"],
  ["italiana", "italian"], ["italyan", "italian"], ["i̇talyan", "italian"],
  ["turkish", "turkish"], ["türk", "turkish"], ["turk", "turkish"], ["türkisch", "turkish"],
]);

export const canonicalizeCuisine = (v: string) => {
  const key = slugify(stripDiacritics(String(v || "")).toLowerCase(), { lower: true, strict: true });
  return CUISINE_CANON_KEYS.get(key) || key || String(v || "").trim().toLowerCase();
};
