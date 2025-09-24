// 📦 Module Index: /src/modules/dashboard/index.ts

// 🌍 Pages
export { default as AdminDashboardPage } from "./admin/pages/page";

// 🔐 Admin Components
export { default as StatsGrid } from "./admin/components/StatsGrid";
export { default as StatCard } from "./admin/components/StatCard";
export { default as ModulesGrid } from "./admin/components/ModulesGrid";
export { default as DashboardCharts } from "./admin/components/DashboardCharts";

// 📊 Analytics Components
export { default as AnalyticsPanel } from "./admin/components/analytics/AnalyticsPanel";
export { default as FilterBar } from "./admin/components/analytics/FilterBar";
export { default as DateRangeSelector } from "./admin/components/analytics/DateRangeSelector";
export { default as LogsList } from "./admin/components/analytics/LogsList";
export { default as LineChart } from "./admin/components/analytics/LineChart";
export { default as BarChart } from "./admin/components/analytics/BarChart";
export { default as AnalyticsTable } from "./admin/components/analytics/AnalyticsTable";


// 📊 Redux Slices
export { default as dashboardReducer } from "./slice/dashboardSlice";
export { default as reportsReducer } from "./slice/reportsSlice";
export { default as dailyOverviewReducer } from "./slice/dailyOverviewSlice";
export { default as chartDataReducer } from "./slice/chartDataSlice";
export { default as analyticsReducer } from "./slice/analyticsSlice"; 

// 📝 Types
export * from "./types";

// locales
export { default as dashboardTranslations } from "./locales";

// 🌐 i18n dosyaları modül içi kullanılır (otomatik yüklenir, elle export gerekmez)
