import { request } from '@playwright/test';
import { config } from './config';
import { getAccessToken } from './auth';

/** Odpytuje warunek aż do skutku lub do upływu limitu czasu (z czytelnym błędem). */
async function waitFor(
  name: string,
  check: () => Promise<boolean>,
  timeoutMs = 120_000,
  intervalMs = 3_000,
): Promise<void> {
  const start = Date.now();
  let lastError = '';
  while (Date.now() - start < timeoutMs) {
    try {
      if (await check()) return;
    } catch (e) {
      lastError = (e as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Środowisko nie jest gotowe: "${name}" niedostępne po ${timeoutMs / 1000}s.\n` +
      (lastError ? `Ostatni błąd: ${lastError}\n` : '') +
      `Uruchom środowisko: cd docker && docker compose up -d (poczekaj aż usługi będą "healthy").`,
  );
}

/**
 * Global setup Playwright: czeka aż wstanie całe środowisko docker-compose
 * (Keycloak + API + frontend), zanim wystartują testy. Dzięki temu pierwszy test
 * nie pada z powodu niegotowego środowiska (start trwa ~60–90 s).
 */
export default async function globalSetup(): Promise<void> {
  // 1) Keycloak — można pobrać token dla użytkownika testowego.
  await waitFor('Keycloak (endpoint tokenu)', async () => {
    const token = await getAccessToken(config.users.alpha);
    return Boolean(token);
  });

  // 2) API — odpowiada na autoryzowane żądanie listy zgłoszeń.
  const token = await getAccessToken(config.users.alpha);
  const apiCtx = await request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  await waitFor('API (GET /troubleTicket)', async () => {
    const res = await apiCtx.get(`${config.apiUrl}/troubleTicket`);
    return res.ok();
  });
  await apiCtx.dispose();

  // 3) Frontend — serwowany przez Nginx.
  const webCtx = await request.newContext();
  await waitFor('Frontend', async () => {
    const res = await webCtx.get(config.frontendUrl);
    return res.ok();
  });
  await webCtx.dispose();
}
