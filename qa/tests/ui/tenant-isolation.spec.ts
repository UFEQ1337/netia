import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';

test('UI: [neg] użytkownik nie widzi zgłoszenia innego tenanta (brak wycieku danych)', async ({
  page,
  betaClient,
}) => {
  // Zgłoszenie tworzymy jako beta; sesja UI należy do alpha.
  const { externalId, ticket } = await seedAcknowledged(betaClient);

  // Przechwytujemy odpowiedź API dla szczegółów — powinna być 404 dla obcego tenanta.
  const responsePromise = page.waitForResponse((r) =>
    r.url().includes(`/troubleTicket/${externalId}`),
  );
  await page.goto(`/tickets/${externalId}`);
  const response = await responsePromise;
  expect(response.status()).toBe(404);

  // Dane zgłoszenia beta nie mogą się pojawić w UI alpha.
  await expect(page.getByText(ticket.description)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: externalId })).toHaveCount(0);
});
