import { test, expect } from '../../src/fixtures';
import { config } from '../../src/config';

// Pełny adres URL omija sklejanie baseURL (które gubiłoby prefiks /api/v1).
const ticketsUrl = `${config.apiUrl}/troubleTicket`;

test.describe('API: uwierzytelnianie', () => {
  test('[neg] żądanie bez tokenu → 401', async ({ request }) => {
    const res = await request.get(ticketsUrl, { failOnStatusCode: false });
    expect(res.status()).toBe(401);
  });

  test('[neg] żądanie z niepoprawnym tokenem → 401', async ({ request }) => {
    const res = await request.get(ticketsUrl, {
      headers: { Authorization: 'Bearer to-nie-jest-prawdziwy-token' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
