import { test, expect } from '../../src/fixtures';
import { EVEN_SERVICE_ID, uniqueExternalId } from '../../src/data';

test('UI: utworzenie zgłoszenia — od formularza, przez szczegóły, po listę', async ({ page }) => {
  const externalId = uniqueExternalId('UI');

  await page.goto('/');
  await page.getByRole('button', { name: 'Nowe zgłoszenie' }).click();
  await expect(page.getByRole('heading', { name: 'Nowe zgłoszenie' })).toBeVisible();

  await page.getByLabel('ID zewnętrzny').fill(externalId);
  await page.getByLabel('ID usługi').fill(String(EVEN_SERVICE_ID));
  await page.getByLabel('Opis').fill('Zgłoszenie utworzone w teście UI');
  await page.getByLabel('Notatka inicjalna (opcjonalna)').fill('Notatka z UI');
  await page.getByRole('button', { name: 'Utwórz zgłoszenie' }).click();

  // Po sukcesie aplikacja przekierowuje na stronę szczegółów.
  await expect(page.getByRole('heading', { name: externalId })).toBeVisible();
  await expect(page.getByText('Przyjęte')).toBeVisible(); // chip statusu acknowledged
  await expect(page.getByText('Notatka z UI')).toBeVisible();

  // Powrót do listy — nowe zgłoszenie jest widoczne.
  await page.getByRole('button', { name: 'Powrót do listy' }).click();
  await expect(page.getByRole('heading', { name: 'Zgłoszenia' })).toBeVisible();
  await expect(page.getByRole('cell', { name: externalId })).toBeVisible();
});
