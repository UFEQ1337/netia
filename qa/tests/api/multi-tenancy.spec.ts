import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';
import type { ApiError, TroubleTicketSummary } from '../../src/api-client';

test.describe('API: izolacja tenantów (multi-tenancy)', () => {
  test('[neg] dostęp do zgłoszenia innego tenanta zwraca 404 (nie 403)', async ({
    alphaClient,
    betaClient,
  }) => {
    const { externalId } = await seedAcknowledged(alphaClient);

    const res = await betaClient.get(externalId);
    // Celowo 404 zamiast 403 — zapobiega enumeracji cudzych zasobów.
    expect(res.status()).toBe(404);
    expect(((await res.json()) as ApiError).code).toBe('TROUBLE_TICKET_NOT_FOUND');
  });

  test('lista zwraca wyłącznie zgłoszenia własnego tenanta', async ({ alphaClient, betaClient }) => {
    const alpha = await seedAcknowledged(alphaClient);
    const beta = await seedAcknowledged(betaClient);

    const res = await alphaClient.list();
    expect(res.status()).toBe(200);

    const externalIds = ((await res.json()) as TroubleTicketSummary[]).map((t) => t.externalId);
    // Asercje "contains/not-contains" zamiast dokładnej liczności — baza zawiera też dane seedowe.
    expect(externalIds).toContain(alpha.externalId);
    expect(externalIds).not.toContain(beta.externalId);
  });
});
