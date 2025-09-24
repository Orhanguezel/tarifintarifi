import type { SupportedLocale } from "@/types/common";

export interface INewsletter {
  _id: string;                 // MongoDB ObjectId
  tenant: string;
  email: string;
  verified: boolean;
  subscribeDate: string;       // ISO Date
  unsubscribeDate?: string;
  lang?: SupportedLocale;
  meta?: any;
}
