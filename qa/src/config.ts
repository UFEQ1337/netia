import dotenv from 'dotenv';

// Wczytujemy zmienne środowiskowe z pliku `.env` (jeśli istnieje) zanim cokolwiek odczyta `process.env`.
// Plik jest opcjonalny — poniżej zdefiniowane są wartości domyślne zgodne z docker-compose.
dotenv.config();

export interface TenantUser {
  /** Login użytkownika w Keycloak. */
  username: string;
  /** Hasło użytkownika. */
  password: string;
  /** Tenant wynikający z claimu `tenant_id` w tokenie (równy nazwie użytkownika). */
  tenant: string;
}

const password = process.env.TT_PASSWORD ?? 'Test1234!';

/**
 * Centralna konfiguracja środowiska testowego.
 * Adresy i dane logowania można nadpisać przez zmienne środowiskowe / plik `.env`.
 */
export const config = {
  /** Adres bazowy API wraz z prefiksem wersji, np. http://localhost:8080/api/v1 */
  apiUrl: process.env.API_URL ?? 'http://localhost:8080/api/v1',
  /** Adres frontendu (SPA). */
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  keycloak: {
    url: process.env.KC_URL ?? 'http://localhost:8180',
    realm: process.env.KC_REALM ?? 'ttapi',
    clientId: process.env.KC_CLIENT_ID ?? 'ttapi-client',
  },
  /** Użytkownicy testowi (każdy w osobnym tenancie). */
  users: {
    alpha: { username: 'alpha', password, tenant: 'alpha' },
    beta: { username: 'beta', password, tenant: 'beta' },
    gamma: { username: 'gamma', password, tenant: 'gamma' },
  } satisfies Record<string, TenantUser>,
  /** Ścieżka pliku ze stanem sesji przeglądarki (logowanie UI reużywane przez testy). */
  authStatePath: '.auth/alpha.json',
} as const;

export type UserKey = keyof typeof config.users;

/** Pełny adres endpointu tokenu OAuth2 (Resource Owner Password Credentials grant). */
export function tokenEndpoint(): string {
  return `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token`;
}
