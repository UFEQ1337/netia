# Testy automatyczne — Trouble Ticket API

Zestaw testów **API** i **UI** dla aplikacji Trouble Ticket API, napisany w **Playwright + TypeScript**.
Testy działają jako **czarna skrzynka** względem uruchomionego środowiska `docker-compose` — realne wywołania HTTP do API (z tokenem z Keycloak) oraz przepływy E2E w przeglądarce.

📄 Dokument strategii testów: [`docs/strategia-testow.md`](docs/strategia-testow.md)

---

## Wymagania

- **Docker** + **Docker Compose v2** — do uruchomienia środowiska aplikacji.
- **Node.js 18+** (zalecane 20/22) i **npm** — do uruchomienia testów.

---

## 1. Uruchomienie środowiska (system pod testem)

Z katalogu głównego repozytorium:

```bash
cd docker
docker compose build      # budowa obrazów backendu i frontendu (jednorazowo)
docker compose up -d      # start: postgres → keycloak → app → frontend
```

Start trwa **~60–90 s** (wymuszona kolejność health-checków). Status:

```bash
docker compose ps         # wszystkie usługi powinny być "Up"/"healthy"
```

| Usługa | Adres |
|---|---|
| Frontend (UI) | http://localhost:3000 |
| API | http://localhost:8080/api/v1 |
| Keycloak | http://localhost:8180 |

> Testy mają wbudowany **readiness check** (`globalSetup`), który czeka na gotowość środowiska, więc nie trzeba ręcznie pilnować momentu startu — wystarczy, że kontenery wstają.

---

## 2. Instalacja i uruchomienie testów

Z katalogu `qa/`:

```bash
cd qa
npm install                       # zależności
npx playwright install chromium   # przeglądarka dla testów UI

npm test            # wszystkie testy (API + UI)
npm run test:api    # tylko testy API
npm run test:ui     # tylko testy UI
npm run report      # otwórz raport HTML z ostatniego uruchomienia
npm run typecheck   # kontrola typów TypeScript
```

Pojedynczy plik / wzorzec nazwy:

```bash
npx playwright test tests/api/notes.spec.ts
npx playwright test -g "izolacja"
```

---

## 3. Konfiguracja

Wszystkie adresy i dane logowania mają **domyślne wartości** zgodne z `docker-compose`, więc konfiguracja jest opcjonalna. Aby nadpisać — skopiuj `.env.example` do `.env`:

```bash
cp .env.example .env
```

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `API_URL` | `http://localhost:8080/api/v1` | adres bazowy API |
| `FRONTEND_URL` | `http://localhost:3000` | adres frontendu |
| `KC_URL` | `http://localhost:8180` | adres Keycloak |
| `KC_REALM` | `ttapi` | realm |
| `KC_CLIENT_ID` | `ttapi-client` | klient (publiczny) |
| `TT_PASSWORD` | `Test1234!` | hasło użytkowników testowych |

Użytkownicy testowi: `alpha`, `beta`, `gamma` (każdy w osobnym tenancie).

---

## 4. Struktura projektu

```
qa/
├─ playwright.config.ts     # projekty: "api", "ui-setup" (logowanie), "ui"
├─ docs/
│  └─ strategia-testow.md   # dokument strategii testów
├─ src/                     # warstwa współdzielona (reużywalna)
│  ├─ config.ts             # konfiguracja + zmienne środowiskowe
│  ├─ auth.ts               # token (password grant) + logowanie UI przez Keycloak
│  ├─ api-client.ts         # klient REST API (typowany)
│  ├─ data.ts               # generatory danych + stałe (parzystość serviceId)
│  ├─ seed.ts               # helpery zasiewu zgłoszeń w znanym statusie
│  ├─ fixtures.ts           # fixture'y Playwright: autoryzowani klienci per tenant
│  └─ readiness.ts          # globalSetup: czeka na gotowość środowiska
└─ tests/
   ├─ api/                  # testy API (czarna skrzynka)
   │  ├─ create-idempotency.spec.ts
   │  ├─ status-transitions.spec.ts
   │  ├─ notes.spec.ts
   │  ├─ multi-tenancy.spec.ts
   │  ├─ auth.spec.ts
   │  └─ contract-gaps.spec.ts
   └─ ui/                   # testy E2E (przeglądarka)
      ├─ auth.setup.ts      # jednorazowe logowanie → storageState
      ├─ create-flow.spec.ts
      ├─ ticket-list.spec.ts
      ├─ form-validation.spec.ts
      ├─ add-note.spec.ts
      ├─ close-ticket.spec.ts
      └─ tenant-isolation.spec.ts
```

### Jak to działa
- **Testy API** używają fixture'ów `alphaClient` / `betaClient` — autoryzowanych klientów REST (token pobierany przez OAuth2 *password grant*, klient `ttapi-client` jest publiczny). Każdy test tworzy własne dane z **unikalnym `externalId`**, więc jest niezależny.
- **Testy UI** logują się **raz** (`auth.setup.ts`) i reużywają sesję (`storageState`), a dane wejściowe przygotowują przez API (szybko i deterministycznie), po czym weryfikują zachowanie w przeglądarce.

---

## 5. Pokrycie scenariuszami (25 testów)

| Obszar | Pozytywne | Negatywne (4xx) |
|---|---|---|
| Tworzenie / idempotencja | parzysty/nieparzysty serviceId, idempotencja 200 | brak `description`, niedozwolony status → 400 |
| Przejścia statusów | zamknięcie z `acknowledged`, auto-notatka | zamknięcie z `rejected` / ponowne → 400 |
| Notatki | dodanie do `acknowledged` | notatka do `rejected` (400), pusta treść (400) |
| Multi-tenancy / auth | lista tylko własnego tenanta | dostęp do cudzego → 404, brak/zły token → 401, brak zasobu → 404 |
| Kontrakt | — | luka `SERVICE_NOT_FOUND` (udokumentowana) |
| UI | logowanie, tworzenie, lista, notatka, zamknięcie | walidacja formularza, brak wycieku danych innego tenanta |

Szczegóły, priorytety i znalezione rozbieżności kontrakt ↔ implementacja: **[`docs/strategia-testow.md`](docs/strategia-testow.md)**.

---

## 6. Diagnostyka

- Po nieudanym teście: `npm run report` (raport HTML), a dla powtórzeń włączony jest **trace** (`trace: 'on-first-retry'`) — `npx playwright show-trace <plik>`.
- Tryb z widoczną przeglądarką / debug: `npx playwright test --project=ui --headed` lub `--debug`.
- Jeśli `globalSetup` zgłasza, że środowisko nie jest gotowe — sprawdź `docker compose ps` i logi `docker compose logs -f app`.
