import { request, type Page } from '@playwright/test';
import { config, tokenEndpoint, type TenantUser } from './config';

/**
 * Cache tokenów w obrębie pojedynczego procesu workera — ogranicza liczbę
 * wywołań Keycloak (token żyje 3600 s, więc spokojnie starcza na czas testów).
 */
const tokenCache = new Map<string, string>();

/**
 * Pobiera token dostępowy dla użytkownika przez OAuth2 Resource Owner Password
 * Credentials grant. Klient `ttapi-client` jest publiczny, więc nie wymaga sekretu.
 */
export async function getAccessToken(user: TenantUser): Promise<string> {
  const cached = tokenCache.get(user.username);
  if (cached) return cached;

  const ctx = await request.newContext();
  try {
    const res = await ctx.post(tokenEndpoint(), {
      form: {
        grant_type: 'password',
        client_id: config.keycloak.clientId,
        username: user.username,
        password: user.password,
      },
      failOnStatusCode: false,
    });
    if (!res.ok()) {
      throw new Error(
        `Nie udało się pobrać tokenu dla użytkownika "${user.username}": ` +
          `HTTP ${res.status()} ${res.statusText()} — ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token) {
      throw new Error(`Odpowiedź tokenu nie zawiera pola access_token (user: ${user.username}).`);
    }
    tokenCache.set(user.username, body.access_token);
    return body.access_token;
  } finally {
    await ctx.dispose();
  }
}

/**
 * Przeprowadza logowanie przez formularz Keycloak w przeglądarce.
 * Po starcie aplikacja (flow `login-required`) przekierowuje na stronę logowania;
 * wypełniamy dane i czekamy na powrót do aplikacji.
 */
export async function loginViaKeycloakUI(page: Page, user: TenantUser): Promise<void> {
  await page.goto('/');

  // Strona logowania Keycloak (identyfikatory pól są stałe niezależnie od języka motywu).
  await page.locator('#username').waitFor({ state: 'visible' });
  await page.fill('#username', user.username);
  await page.fill('#password', user.password);
  await page.click('#kc-login');

  // Powrót do aplikacji — nagłówek paska aplikacji potwierdza zalogowanie.
  await page.getByText('Trouble Ticket System').waitFor({ state: 'visible' });
}
