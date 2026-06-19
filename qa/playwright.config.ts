import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config';

/**
 * Konfiguracja Playwright dla dwóch obszarów testów:
 *  - `api` — testy REST API (bez przeglądarki, kontekst `request`),
 *  - `ui`  — testy E2E przez przeglądarkę (Chromium), z reużyciem sesji logowania.
 *
 * `globalSetup` (readiness check) upewnia się, że środowisko docker-compose
 * jest dostępne, zanim ruszą jakiekolwiek testy.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './src/readiness.ts',
  // Limit czasu pojedynczego testu — logowanie UI przez Keycloak bywa wolniejsze.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: config.apiUrl },
    },
    // Jednorazowe logowanie do UI — zapisuje stan sesji do pliku.
    {
      name: 'ui-setup',
      testDir: './tests/ui',
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: config.frontendUrl },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['ui-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.frontendUrl,
        storageState: config.authStatePath,
      },
    },
  ],
});
