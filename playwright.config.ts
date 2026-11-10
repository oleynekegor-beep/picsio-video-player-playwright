import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.PICSIO_BASE_URL ?? 'https://pics.io',
    ...(env.PICSIO_STORAGE_STATE
      ? { storageState: env.PICSIO_STORAGE_STATE }
      : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
