import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';

test('UI: lista zgłoszeń pokazuje nagłówki kolumn i utworzone zgłoszenie', async ({
  page,
  alphaClient,
}) => {
  const { externalId } = await seedAcknowledged(alphaClient);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Zgłoszenia' })).toBeVisible();

  // Nagłówki tabeli.
  await expect(page.getByRole('columnheader', { name: 'ID zewnętrzny' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();

  // Utworzone zgłoszenie jest na liście wraz z chipem statusu.
  const row = page.getByRole('row', { name: new RegExp(externalId) });
  await expect(row).toBeVisible();
  await expect(row.getByText('Przyjęte')).toBeVisible();
});
