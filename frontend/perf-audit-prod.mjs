// perf-audit-prod.mjs
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import http from "node:http";

const PORT = Number(process.env.PORT || 3002);
const BASE = `http://localhost:${PORT}`;

// Ölçülecek sayfalar
const PAGES = [
  "/tr?sort=date_desc",
  "/en?sort=date_desc",
];

function ping(url, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const req = http.get(url, () => { req.destroy(); resolve(true); });
    req.on("error", () => resolve(false));
    setTimeout(() => { try { req.destroy(); } catch {} resolve(false); }, timeoutMs);
  });
}

async function waitUntilUp(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await ping(url)) return true;
    await wait(1000);
  }
  throw new Error(`Server not responding: ${url}`);
}

async function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: false, env: { ...process.env, ...env } });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} -> ${code}`))));
  });
}

(async () => {
  // 1) Build (prod)
  await run("bun", ["run", "build"], { NODE_ENV: "production" });

  // 2) Start prod server
  const server = spawn("bun", ["run", "start", "-p", String(PORT)], {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), NEXT_TELEMETRY_DISABLED: "1" },
  });

  try {
    // 3) Up olana kadar bekle
    await waitUntilUp(`${BASE}/`);

    // 4) Var olan Lighthouse scriptini (perf-audit.mjs) prod base ile koştur
    //    (raporlar aynı klasöre düşer)
    await run("node", ["perf-audit.mjs"], { PERF_BASE: BASE });
  } finally {
    // 5) Sunucuyu kapat
    try { server.kill("SIGTERM"); } catch {}
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
