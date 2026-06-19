import { test, expect } from '../../src/fixtures';
import { seedAcknowledged } from '../../src/seed';

test('UI: dodanie notatki do aktywnego zgłoszenia', async ({ page, alphaClient }) => {
  // Przygotowanie danych przez API: zgłoszenie acknowledged z 1 notatką inicjalną.
  const { externalId } = await seedAcknowledged(alphaClient, 'Notatka startowa');

  await page.goto(`/tickets/${externalId}`);
  await expect(page.getByRole('heading', { name: externalId })).toBeVisible();
  await expect(page.getByText('Notatki (1)')).toBeVisible();

  const noteText = `Notatka dodana w UI ${Date.now()}`;
  await page.getByLabel('Treść notatki').fill(noteText);
  await page.getByRole('button', { name: 'Dodaj notatkę' }).click();

  // Nowa notatka pojawia się na liście, licznik rośnie, widać potwierdzenie.
  await expect(page.getByText(noteText)).toBeVisible();
  await expect(page.getByText('Notatki (2)')).toBeVisible();
  await expect(page.getByText('Notatka została dodana')).toBeVisible();
});
