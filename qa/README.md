# Testy automatyczne — Trouble Ticket API

Zestaw testów **API** i **UI** (Playwright + TypeScript) działających jako czarna skrzynka względem uruchomionego środowiska `docker-compose`.
Dokument strategii testów: [`docs/strategia-testow.md`](docs/strategia-testow.md).

## Wymagania

- Docker + Docker Compose v2
- Node.js 18+ (zalecane 20/22) + npm

## 1. Uruchomienie środowiska

```bash
cd docker
docker compose up -d --build   # postgres → keycloak → app → frontend (~60–90 s)
docker compose ps              # poczekaj, aż usługi będą "healthy"
```

| Usługa | Adres |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080/api/v1 |
| Keycloak | http://localhost:8180 |

Testy mają wbudowany readiness check (`globalSetup`), więc same czekają na gotowość środowiska.

## 2. Uruchomienie testów

```bash
cd qa
npm install
npx playwright install chromium

npm test            # wszystkie testy (API + UI)
npm run test:api    # tylko API
npm run test:ui     # tylko UI
npm run report      # raport HTML z ostatniego uruchomienia
```

## 3. Konfiguracja

Domyślne wartości są zgodne z `docker-compose`, więc `.env` jest opcjonalny (wzór w [`.env.example`](.env.example)).

| Zmienna | Domyślnie |
|---|---|
| `API_URL` | `http://localhost:8080/api/v1` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `KC_URL` / `KC_REALM` / `KC_CLIENT_ID` | `http://localhost:8180` / `ttapi` / `ttapi-client` |
| `TT_PASSWORD` | `Test1234!` |

Użytkownicy testowi: `alpha`, `beta`, `gamma` (każdy w osobnym tenancie).

## 4. Struktura

```
qa/
├─ playwright.config.ts     # projekty: "api", "ui-setup" (logowanie), "ui"
├─ docs/strategia-testow.md
├─ src/                     # warstwa współdzielona (config, auth, klient API, fixtures, readiness)
└─ tests/
   ├─ api/                  # testy API (czarna skrzynka)
   └─ ui/                   # testy E2E (przeglądarka)
```

- **API** — autoryzowani klienci per tenant (token z Keycloak); każdy test tworzy własne dane z unikalnym `externalId`.
- **UI** — logowanie raz (`auth.setup.ts` → `storageState`), dane wejściowe przygotowane przez API.

## 5. Diagnostyka

- `npm run report` — raport HTML; dla powtórek włączony trace (`npx playwright show-trace <plik>`).
- Tryb z widoczną przeglądarką: `npx playwright test --project=ui --headed`.
- Jeśli readiness check zgłasza brak gotowości — sprawdź `docker compose ps` i `docker compose logs -f app`.

## 6. CI

Workflow [`.github/workflows/tests.yml`](../.github/workflows/tests.yml) (push / PR / ręcznie): `docker compose up --build` → testy → raport HTML jako artefakt → `down -v`.
