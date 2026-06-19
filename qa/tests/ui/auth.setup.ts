import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../src/config';
import { loginViaKeycloakUI } from '../../src/auth';

/**
 * Jednorazowe logowanie do UI przez formularz Keycloak.
 * Zapisany stan sesji (cookies SSO) jest reużywany przez wszystkie testy projektu `ui`,
 * dzięki czemu nie logujemy się ponownie w każdym teście.
 */
setup('logowanie jako alpha i zapis stanu sesji', async ({ page }) => {
  await loginViaKeycloakUI(page, config.users.alpha);

  fs.mkdirSync(path.dirname(config.authStatePath), { recursive: true });
  await page.context().storageState({ path: config.authStatePath });
});
