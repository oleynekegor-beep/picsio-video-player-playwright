import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const endpoint = process.env.PLAYWRIGHT_CDP_URL ?? 'http://127.0.0.1:9222';
const statePath = '.auth/user.json';

await mkdir('.auth', { recursive: true });

const browser = await chromium.connectOverCDP(endpoint);
try {
  const [context] = browser.contexts();
  if (!context) {
    throw new Error(`No Chrome browser context found at ${endpoint}`);
  }

  await context.storageState({ path: statePath });
  console.log(`Saved local Playwright storage state to ${statePath}`);
} finally {
  await browser.close();
}
