import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/19ekim/`,
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Veri ve bağlantı testleri tarayıcıdan bağımsızdır; yalnız Chromium projesinde bir kez çalışır.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /(data|opex-motor|opex-script)\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /(data|opex-motor|opex-script)\.spec\.ts/ },
  ],
  // Üretim derlemesi (dist) üzerinde çalışır: önce `npm run build`.
  webServer: {
    command: `node scripts/serve-dist.mjs`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/19ekim/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
