// types/notification.ts
import type { SupportedLocale } from "@/types/common";

export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;
export type NotificationChannel = "inapp" | "email" | "webhook" | "push" | "sms";
export type DeliveryStatus = "pending" | "sent" | "failed";

export interface INotificationTarget {
  users?: string[];
  roles?: string[];
  employees?: string[];
  allTenant?: boolean;
}

export interface INotificationSource {
  module: string;
  entity?: string;
  refId?: string;
  event?: string;
}

export interface INotificationLink {
  href?: string;
  routeName?: string;
  params?: Record<string, string | number>;
}

export interface INotificationAction {
  key: string;
  label: TranslatedLabel;
  link?: INotificationLink;
  method?: "GET" | "POST";
  payload?: any;
}

export interface INotificationDelivery {
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  lastError?: string;
  sentAt?: string; // ISO
}

export interface INotification {
  _id: string;

  tenant: string;
  user?: string | { _id: string; name?: string; email?: string } | null; // populate olmuş olabilir
  target?: INotificationTarget;

  type: "info" | "success" | "warning" | "error";
  title: TranslatedLabel;
  message: TranslatedLabel;

  data?: any;
  link?: INotificationLink;
  actions?: INotificationAction[];

  channels?: NotificationChannel[];
  deliveries?: INotificationDelivery[];

  priority?: 1 | 2 | 3 | 4 | 5;

  isRead: boolean;
  readAt?: string;       // ISO
  deliveredAt?: string;  // ISO
  isActive: boolean;

  scheduleAt?: string;   // ISO
  notBefore?: string;    // ISO
  expireAt?: string;     // ISO

  dedupeKey?: string;
  dedupeWindowMin?: number;

  source?: INotificationSource;

  tags?: string[];

  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}

export type CreateNotificationPayload = {
  user?: string | null;
  target?: INotificationTarget;
  type: "info" | "success" | "warning" | "error";
  title: TranslatedLabel;
  message: TranslatedLabel;
  data?: any;
  link?: INotificationLink;
  actions?: INotificationAction[];
  channels?: NotificationChannel[];
  priority?: 1 | 2 | 3 | 4 | 5;
  scheduleAt?: string;
  notBefore?: string;
  expireAt?: string;
  dedupeKey?: string;
  dedupeWindowMin?: number;
  source?: INotificationSource;
  tags?: string[];
  isActive?: boolean;
};
