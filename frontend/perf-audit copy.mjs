// perf-audit.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lighthouse from "lighthouse";
import chromeLauncher from "chrome-launcher";
import Table from "cli-table3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Ayarlar ----
// Uygulaman lokal olarak 3001’de çalışıyor (ekrana attığın loglarda öyle).
const BASE = process.env.PERF_BASE || "http://localhost:3000";

// Test etmek istediğin sayfalar:
const URLS = [
  `${BASE}/en?sort=date_desc`,
  `${BASE}/tr?sort=date_desc`,
  // gerekiyorsa ekle:
  // `${BASE}/en/recipes/some-slug`,
];

// Eşikler (düşerse script exit 1 ile biter)
const THRESHOLDS = {
  performance: 0.60, // 0–1 (örn. %60)
  lcp: 4000,         // ms
  tbt: 300,          // ms
  cls: 0.10,
};

const REPORT_DIR = path.join(__dirname, "lighthouse-reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

// Mobile emülasyon (Lighthouse default'u)
const settings = {
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
};

function ms(v) { return typeof v === "number" ? Math.round(v) : "-"; }
function pct(v) { return typeof v === "number" ? Math.round(v * 100) : "-"; }

async function runLH(url, chrome) {
  const opts = { logLevel: "error", output: ["json", "html"], port: chrome.port };
  const { lhr, report } = await lighthouse(url, opts, { settings });

  const audits = lhr.audits;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = url.replace(BASE, "").replace(/[/?=&]+/g, "_").replace(/^_+|_+$/g, "") || "home";
  const htmlPath = path.join(REPORT_DIR, `${base}-${stamp}.html`);
  const jsonPath = path.join(REPORT_DIR, `${base}-${stamp}.json`);

  fs.writeFileSync(htmlPath, report[1]); // html
  fs.writeFileSync(jsonPath, report[0]); // json

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
  // Linux'ta Chrome yoksa chromium kur ve CHROME_PATH ver:
  // env örneği: CHROME_PATH=/usr/bin/chromium-browser bun run perf:audit
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH, // opsiyonel
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  const rows = [];
  const fails = [];

  try {
    for (const url of URLS) {
      const m = await runLH(url, chrome);

      // eşik kontrolleri
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
