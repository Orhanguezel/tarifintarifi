// 📦 Module Index: /src/modules/dashboard/index.ts

// 📦 Admin 
export { default as AdminNewsletterPage } from "./admin/pages/AdminNewsletterPage";


// 🔐 Admin Components
export { default as SubscriberList } from "./admin/components/SubscriberList";
export { default as SubscriberModal } from "./admin/components/SubscriberModal";
export { default as BulkSendModal } from "./admin/components/BulkSendModal";
export { default as SingleSendModal } from "./admin/components/SingleSendModal";
export { default as PreviewModal } from "./admin/components/PreviewModal";

// 📦 Public Components
export { default as NewsletterButton } from "./public/components/NewsletterButton";
export { default as NewsletterModal } from "./public/components/NewsletterModal";

// 📊 Redux Slices

export { default as newsletterSlice } from "./slice/newsletterSlice";


// 📝 Types
//export * from "./types";

// 🌐 i18n dosyaları modül içi kullanılır (otomatik yüklenir, elle export gerekmez)
