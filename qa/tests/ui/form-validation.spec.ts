import { test, expect } from '../../src/fixtures';

test('UI: [neg] walidacja pustego formularza blokuje wysłanie i pokazuje komunikaty', async ({
  page,
}) => {
  await page.goto('/tickets/new');
  await expect(page.getByRole('heading', { name: 'Nowe zgłoszenie' })).toBeVisible();

  // Próba wysłania pustego formularza.
  await page.getByRole('button', { name: 'Utwórz zgłoszenie' }).click();

  // Pozostajemy na formularzu (brak nawigacji), pojawiają się komunikaty walidacji.
  await expect(page).toHaveURL(/\/tickets\/new$/);
  await expect(page.getByText('Pole wymagane').first()).toBeVisible();
});
