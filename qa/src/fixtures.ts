import { test as base } from '@playwright/test';
import { config } from './config';
import { getAccessToken } from './auth';
import { TicketClient } from './api-client';

/**
 * Fixture'y udostępniające autoryzowanych klientów API per tenant.
 * Nagłówek `Authorization` jest ustawiany na kontekście, więc dotyczy wszystkich żądań.
 * Klienci są tworzeni leniwie — token pobierany jest tylko wtedy, gdy test ich użyje.
 */
interface ApiFixtures {
  /** Klient API uwierzytelniony jako użytkownik `alpha`. */
  alphaClient: TicketClient;
  /** Klient API uwierzytelniony jako użytkownik `beta` (do testów izolacji tenantów). */
  betaClient: TicketClient;
}

export const test = base.extend<ApiFixtures>({
  alphaClient: async ({ playwright }, use) => {
    const token = await getAccessToken(config.users.alpha);
    const ctx = await playwright.request.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(new TicketClient(ctx, config.apiUrl));
    await ctx.dispose();
  },
  betaClient: async ({ playwright }, use) => {
    const token = await getAccessToken(config.users.beta);
    const ctx = await playwright.request.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(new TicketClient(ctx, config.apiUrl));
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
