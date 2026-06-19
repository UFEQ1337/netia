import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';

test('UI: [neg] błąd z API jest prezentowany w snackbarze (nieaktualny stan UI)', async ({
  page,
  alphaClient,
}) => {
  // Zgłoszenie acknowledged — przycisk "Zamknij zgłoszenie" jest dostępny w UI.
  const { externalId } = await seedAcknowledged(alphaClient);
  await page.goto(`/tickets/${externalId}`);
  await expect(page.getByRole('button', { name: 'Zamknij zgłoszenie' })).toBeVisible();

  // W tle (przez API) zamykamy zgłoszenie — widok w przeglądarce ma teraz nieaktualny stan.
  expect((await alphaClient.close(externalId)).status()).toBe(200);

  // Klik na nieaktualnym przycisku → backend odrzuca przejście closed -> closed (400).
  await page.getByRole('button', { name: 'Zamknij zgłoszenie' }).click();

  // Komunikat błędu z API trafia do snackbara (MUI Alert, role="alert").
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Niedozwolone przejście statusu');
});
