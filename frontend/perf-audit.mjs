// perf-audit.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lighthouse from "lighthouse";
import { launch as launchChrome } from "chrome-launcher";
import Table from "cli-table3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = process.env.PERF_BASE || "http://localhost:3001";
const URLS = [
  `${BASE}/en?sort=date_desc`,
  `${BASE}/tr?sort=date_desc`,
];

// Eşikler
const THRESHOLDS = { performance: 0.60, lcp: 4000, tbt: 300, cls: 0.10 };

// Rapor klasörü
const REPORT_DIR = path.join(__dirname, "lighthouse-reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

// ⚠️ V12 için: default config'i extend et
const CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, disabled: false },
    throttlingMethod: "devtools",
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
  },
};

function ms(v)  { return typeof v === "number" ? Math.round(v) : "-"; }
function pct(v) { return typeof v === "number" ? Math.round(v * 100) : "-"; }

async function runLH(url, chrome) {
  const flags = { logLevel: "error", output: ["json", "html"], port: chrome.port };

  // run
  const { lhr, report } = await lighthouse(url, flags, CONFIG);

  // report string/dizi farkını güvenli ele al
  const htmlReport = Array.isArray(report)
    ? report.find((r) => typeof r === "string" && r.includes("<!doctype html"))
    : report;
  const jsonReport = Array.isArray(report)
    ? report.find((r) => typeof r === "string" && r.trim().startsWith("{"))
    : JSON.stringify(lhr, null, 2);

  const audits = lhr.audits;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = url.replace(BASE, "").replace(/[/?=&]+/g, "_").replace(/^_+|_+$/g, "") || "home";
  const htmlPath = path.join(REPORT_DIR, `${base}-${stamp}.html`);
  const jsonPath = path.join(REPORT_DIR, `${base}-${stamp}.json`);

  if (htmlReport) fs.writeFileSync(htmlPath, htmlReport);
  if (jsonReport) fs.writeFileSync(jsonPath, jsonReport);

  return {
    perf: lhr.categories.performance.score,
    fcp: audits["first-contentful-paint"]?.numericValue,
    lcp: audits["largest-contentful-paint"]?.numericValue,
    si:  audits["speed-index"]?.numericValue,
    tbt: audits["total-blocking-time"]?.numericValue,
    cls: audits["cumulative-layout-shift"]?.numericValue,
    htmlPath, jsonPath,
  };
}

(async () => {
  const chrome = await launchChrome({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  const rows = [];
  const fails = [];

  try {
    for (const url of URLS) {
      const m = await runLH(url, chrome);

      if (m.perf < THRESHOLDS.performance) fails.push(`${url} perf<${THRESHOLDS.performance}`);
      if (m.lcp > THRESHOLDS.lcp)           fails.push(`${url} lcp>${THRESHOLDS.lcp}ms`);
      if (m.tbt > THRESHOLDS.tbt)           fails.push(`${url} tbt>${THRESHOLDS.tbt}ms`);
      if (m.cls > THRESHOLDS.cls)           fails.push(`${url} cls>${THRESHOLDS.cls}`);

      rows.push([
        url.replace(BASE, "") || "/",
        `${pct(m.perf)}`,
        `${ms(m.fcp)}`,
        `${ms(m.lcp)}`,
        `${ms(m.si)}`,
        `${ms(m.tbt)}`,
        `${m.cls?.toFixed(3) ?? "-"}`,
        path.basename(m.htmlPath),
      ]);
    }
  } finally {
    await chrome.kill();
  }

  const table = new Table({ head: ["URL", "Perf", "FCP", "LCP", "SI", "TBT", "CLS", "Report"] });
  table.push(...rows);
  console.log(table.toString());
  console.log(`Raporlar: ${REPORT_DIR}`);

  if (fails.length) {
    console.error("\n❌ Threshold failures:");
    fails.forEach((f) => console.error(" -", f));
    process.exit(1);
  }
  console.log("\n✅ All thresholds passed.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
