// playwright.config.ts
/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT || 3001);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests",
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: `bun run dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120000
      },
  projects: [{ name: "Chromium", use: { ...devices["Desktop Chrome"] } }]
});
