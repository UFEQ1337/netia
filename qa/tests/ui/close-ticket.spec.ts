import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';

test('UI: zamknięcie zgłoszenia zmienia status i ukrywa akcje', async ({ page, alphaClient }) => {
  const { externalId } = await seedAcknowledged(alphaClient);

  await page.goto(`/tickets/${externalId}`);
  await expect(page.getByText('Przyjęte')).toBeVisible();

  await page.getByRole('button', { name: 'Zamknij zgłoszenie' }).click();

  // Potwierdzenie, zmiana chipa statusu na "Zamknięte" oraz ukrycie akcji.
  await expect(page.getByText('Zgłoszenie zostało zamknięte')).toBeVisible();
  // exact:true — inaczej dopasowałoby też snackbar "...zostało zamknięte".
  await expect(page.getByText('Zamknięte', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zamknij zgłoszenie' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dodaj notatkę' })).toHaveCount(0);
});
