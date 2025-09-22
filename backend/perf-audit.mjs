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
const BASE = process.env.PERF_BASE || "http://localhost:3001";
const URLS = [
  `${BASE}/en?sort=date_desc`,
  `${BASE}/tr?sort=date_desc`,
  // gerekirse ek sayfalar:
  // `${BASE}/en/recipes/turkish-scrambled-eggs`,
];

const THRESHOLDS = {
  performance: 0.60, // 0–1 arası (ör. %60)
  lcp: 4000,         // ms
  tbt: 300,          // ms
  cls: 0.1,
};

const REPORT_DIR = path.join(__dirname, "lighthouse-reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

// mobile emülasyon (Lighthouse default “mobile”)
// desktop için formFactor: 'desktop' kullanabilirsiniz (aşağıda varyant örneği var).
const settings = {
  onlyCategories: ["performance"],
  formFactor: "mobile",
  screenEmulation: { mobile: true, disabled: false },
  throttlingMethod: "devtools",
  throttling: {
    rttMs: 150, throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4, requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.560, uploadThroughputKbps: 675,
  },
};

// ---- yardımcılar ----
function ms(num) { return typeof num === "number" ? Math.round(num) : "-"; }
function pct(num) { return typeof num === "number" ? Math.round(num * 100) : "-"; }

async function runLighthouse(url, chrome) {
  const opts = { logLevel: "error", output: ["json", "html"], port: chrome.port };
  const { lhr, report } = await lighthouse(url, opts, { settings });

  // raporları kaydet
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = url.replace(BASE, "").replace(/[/?=&]+/g, "_").replace(/^_+|_+$/g, "") || "home";
  const htmlPath = path.join(REPORT_DIR, `${base}-${stamp}.html`);
  const jsonPath = path.join(REPORT_DIR, `${base}-${stamp}.json`);
  fs.writeFileSync(htmlPath, report[1]); // html
  fs.writeFileSync(jsonPath, report[0]); // json

  // metrikler
  const audits = lhr.audits;
  const metrics = {
    perf: lhr.categories.performance.score,          // 0..1
    fcp: audits["first-contentful-paint"]?.numericValue, // ms
    lcp: audits["largest-contentful-paint"]?.numericValue,
    si:  audits["speed-index"]?.numericValue,
    tbt: audits["total-blocking-time"]?.numericValue,
    cls: audits["cumulative-layout-shift"]?.numericValue,
    htmlPath, jsonPath,
  };
  return metrics;
}

(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
  const rows = [];
  const failures = [];

  try {
    for (const url of URLS) {
      const m = await runLighthouse(url, chrome);

      // eşik kontrol
      if (m.perf < THRESHOLDS.performance) failures.push(`${url} perf<${THRESHOLDS.performance}`);
      if (m.lcp > THRESHOLDS.lcp) failures.push(`${url} lcp>${THRESHOLDS.lcp}ms`);
      if (m.tbt > THRESHOLDS.tbt) failures.push(`${url} tbt>${THRESHOLDS.tbt}ms`);
      if (m.cls > THRESHOLDS.cls) failures.push(`${url} cls>${THRESHOLDS.cls}`);

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

  // tablo
  const table = new Table({
    head: ["URL", "Perf", "FCP", "LCP", "SI", "TBT", "CLS", "Report"],
  });
  table.push(...rows);
  console.log(table.toString());
  console.log(`Raporlar: ${REPORT_DIR}`);

  if (failures.length) {
    console.error("\n❌ Threshold failures:");
    failures.forEach((f) => console.error(" -", f));
    process.exit(1);
  } else {
    console.log("\n✅ All thresholds passed.");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
