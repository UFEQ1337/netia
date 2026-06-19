# Strategia testów — Trouble Ticket API

> Dokument strategii testów dla aplikacji **Trouble Ticket API** (zadanie rekrutacyjne, stanowisko: Tester automatyzacji).
> Towarzyszy mu implementacja scenariuszy w katalogu [`qa/`](../) (Playwright + TypeScript) oraz instrukcja uruchomienia w [`qa/README.md`](../README.md).

---

## 1. Wprowadzenie i cel

Trouble Ticket API to system zarządzania zgłoszeniami serwisowymi (minimalny profil TMF621). Składa się z:

- **Backend REST** — Spring Boot 4 / Java 21, kontrakt design-first (OpenAPI 3.1),
- **Frontend SPA** — React + TypeScript + Material UI,
- **Uwierzytelnianie** — Keycloak (OAuth2/OIDC, Bearer JWT), izolacja danych per tenant,
- **Baza danych** — PostgreSQL (migracje Liquibase, dane zasiewane).

Celem strategii jest zapewnienie, że **reguły biznesowe i kontrakt API są przestrzegane**, dane między tenantami są **w pełni izolowane**, a interfejs użytkownika poprawnie odzwierciedla stan systemu i obsługuje błędy. Strategia obejmuje zarówno ścieżki pozytywne, jak i — ze szczególnym naciskiem — **ścieżki negatywne i przypadki brzegowe**.

Zakres testów to **czarna skrzynka (black-box)** względem uruchomionego środowiska `docker-compose` — testujemy system tak, jak widzi go klient API i użytkownik UI, bez modyfikacji kodu aplikacji.

---

## 2. Identyfikacja obszarów do testowania

### 2.1. Backend / API
| Obszar | Co testujemy |
|---|---|
| Tworzenie zgłoszeń | walidacja wejścia, dozwolony status `new`, notatka inicjalna, nagłówek `Location`, status początkowy |
| Idempotencja | unikalność `(tenantId, externalId)`; ponowne utworzenie zwraca 200 z istniejącym zasobem |
| Przejścia statusów | zamknięcie tylko z `acknowledged`/`inProgress`; odrzucenie pozostałych przejść; auto-notatka |
| Notatki | dozwolone w `new`/`acknowledged`/`inProgress`; blokada w `resolved`/`closed`/`rejected` |
| Multi-tenancy | tenant wyłącznie z claimu `tenant_id`; brak dostępu do cudzych zasobów (404, nie 403) |
| Uwierzytelnianie/autoryzacja | brak tokenu / zły token → 401; brak uprawnień → 403 |
| Kontrakt OpenAPI | zgodność kodów błędów, kształtu odpowiedzi i statusów HTTP ze specyfikacją |
| Walidacja granic | puste/brakujące pola, niedozwolone wartości enum, wartości spoza zakresu |

### 2.2. Frontend / UI
| Obszar | Co testujemy |
|---|---|
| Logowanie | przekierowanie do Keycloak (flow `login-required` + PKCE), powrót do aplikacji |
| Lista zgłoszeń | render tabeli, etykiety statusów (chip), nawigacja do szczegółów |
| Formularz tworzenia | poprawne wysłanie, walidacja po stronie klienta, przekierowanie po sukcesie |
| Szczegóły zgłoszenia | prezentacja danych i historii notatek |
| Dodawanie notatek | formularz, aktualizacja listy notatek, komunikat potwierdzenia |
| Zamykanie zgłoszenia | zmiana statusu, ukrycie akcji niedostępnych w stanie końcowym |
| Obsługa błędów | komunikaty (snackbar), brak wycieku danych innego tenanta |

### 2.3. Przekrojowe (cross-cutting)
- **Bezpieczeństwo / izolacja danych** — najwyższy priorytet (dane różnych operatorów).
- **Spójność kontraktu** — odpowiedź API vs OpenAPI vs faktyczne zachowanie.
- **Determinizm danych testowych** — niezależność testów od danych zasiewanych.

---

## 3. Priorytetyzacja

Priorytet = wpływ na biznes/bezpieczeństwo × prawdopodobieństwo wystąpienia błędu.

| Priorytet | Obszary | Uzasadnienie |
|---|---|---|
| **Krytyczny (P1)** | Izolacja tenantów, uwierzytelnianie, przejścia statusów | Naruszenie izolacji = wyciek danych między operatorami; błędne przejścia = niespójny stan zgłoszeń |
| **Wysoki (P2)** | Idempotencja tworzenia, walidacja wejścia, reguły notatek | Bezpośrednio wpływają na integralność danych i kontrakt z klientami API |
| **Średni (P3)** | Ścieżki happy-path UI (tworzenie, lista, notatka, zamknięcie) | Wpływ na użytkownika, ale błędy są zwykrywalne i mniej krytyczne |
| **Niski (P4)** | Kosmetyka UI, etykiety, formatowanie dat | Niewielki wpływ, łatwa naprawa |

Testy P1–P2 powinny być uruchamiane w każdym buildzie (smoke + regresja). P3 w pełnej regresji. P4 okresowo / wizualnie.

---

## 4. Podejście do testowania

### 4.1. Poziomy testów (piramida)
- **Testy jednostkowe / komponentowe** — odpowiedzialność zespołu deweloperskiego (np. reguły w serwisie domenowym). W repozytorium aplikacji istnieją już testy integracyjne Spring (MockMvc + Testcontainers) — uzupełniają nasz zakres, ale są to testy *białej skrzynki* z mockowanym JWT.
- **Testy API (integracyjne, black-box)** — **główny fokus**. Realne wywołania HTTP do uruchomionego API z prawdziwym tokenem z Keycloak. Szybkie, stabilne, pokrywają reguły biznesowe i kontrakt.
- **Testy E2E (UI)** — **drugi fokus**. Pełne przepływy w przeglądarce, łącznie z realnym logowaniem przez Keycloak. Weryfikują integrację frontend ↔ backend ↔ auth z perspektywy użytkownika.
- **Testy kontraktowe / wydajnościowe / bezpieczeństwa** — poza zakresem tego zadania, wskazane jako dalszy krok (sekcja 8).

### 4.2. Wybór narzędzi
Wybrano **ujednolicony stack Playwright + TypeScript** dla obu obszarów (API i UI):
- **Zgodność technologiczna** — TypeScript jest językiem frontendu aplikacji.
- **Jeden runner, jeden raport** — Playwright ma pierwszorzędną obsługę testów API (`request`) oraz E2E, wspólne fixture'y, równoległość i `trace viewer` do diagnostyki.
- **Realne logowanie** — Playwright dobrze radzi sobie z przepływem przekierowań OAuth2/OIDC; sesję logujemy raz i reużywamy (`storageState`).

> Alternatywy rozważone: REST Assured + JUnit (Java) dla API oraz Selenium dla UI. Odrzucone na rzecz spójności (jeden toolchain, mniejszy koszt utrzymania, szybsza diagnostyka).

### 4.3. Zasady projektowe testów
- **Niezależność** — każdy test tworzy własne dane przez API (unikalny `externalId`), nie zależy od kolejności ani od danych zasiewanych.
- **Reużywalność** — wspólna warstwa: konfiguracja, pobieranie tokenu, klient API, generatory danych, helpery zasiewu, fixture'y ([`qa/src/`](../src/)).
- **Czytelność** — testy w stylu *Arrange–Act–Assert*, opisowe nazwy w języku domeny, asercje na kodach błędów (`code`) zamiast na komunikatach (odporność na zmiany treści).
- **Determinizm** — asercje typu „zawiera/nie zawiera" zamiast dokładnej liczności tam, gdzie w bazie są dane zasiewane.

---

## 5. Ryzyka i wyzwania (oraz mitygacja)

| Ryzyko / wyzwanie | Wpływ | Mitygacja |
|---|---|---|
| **Niedeterministyczne dane zasiewane** — skrypt 005 tworzy *losową* liczbę notatek na zgłoszenie | Fałszywe wyniki przy asercji liczności | Tworzymy własne dane (fixtures) z unikalnym `externalId`; na danych zasiewanych tylko odczyt i asercje „zawiera" |
| **Logowanie przez Keycloak w UI** — przekierowania, czas, potencjalna niestabilność | Flaky testy E2E | Logowanie raz w `auth.setup.ts` → `storageState` (cookie SSO) reużywane; retry w CI; jawne oczekiwania na elementy |
| **Czas startu środowiska** (~60–90 s, kolejność health-checków) | Pierwsze testy padają na niegotowym środowisku | `globalSetup` (readiness check) czeka na token Keycloak + autoryzowane API + frontend z czytelnym komunikatem |
| **Sklejanie `baseURL`** gubiące prefiks `/api/v1` | Błędne adresy w testach API | Klient API buduje pełne adresy URL, nie polega na sklejaniu `baseURL` |
| **Rozbieżności kontrakt ↔ implementacja** (patrz sekcja 7) | Testy oparte na specyfikacji padają lub maskują defekty | Testy dokumentują **stan faktyczny** z jawnym komentarzem; rozbieżności raportowane jako defekty/pytania do analizy |
| **Wygaśnięcie / unieważnienie tokenu** | Niestabilność długich serii | Token cache'owany per worker; żywotność 3600 s wystarcza na czas testów |
| **Brak izolacji między uruchomieniami** (dane narastają w bazie) | Kolizje `externalId` | Unikalny `externalId` (timestamp + licznik + losowość) |
| **Zależność od środowiska zewnętrznego** (Docker) | Brak możliwości uruchomienia | README z dokładną instrukcją; readiness check; (dalej) pipeline CI |

---

## 6. Propozycja scenariuszy testowych

Legenda typu: ✅ pozytywny · ⛔ negatywny (4xx/błąd). Kolumna „Status" oznacza, czy scenariusz został **zaimplementowany** w tym zadaniu.

### 6.1. API — tworzenie i idempotencja
| # | Scenariusz | Typ | Prio | Oczekiwany rezultat | Status |
|---|---|---|---|---|---|
| A1 | Utworzenie z parzystym `serviceId` | ✅ | P2 | 201, `acknowledged`, `Location`, notatka inicjalna | ✔ |
| A2 | Utworzenie z nieparzystym `serviceId` | ✅ | P2 | 201, **`rejected`** (rozbieżność, sekcja 7) | ✔ |
| A3 | Idempotencja `(tenant, externalId)` | ✅ | P2 | 200 z istniejącym zasobem | ✔ |
| A4 | Brak pola `description` | ⛔ | P2 | 400 `VALIDATION_ERROR` | ✔ |
| A5 | Niedozwolony status w `create` (`closed`) | ⛔ | P2 | 400 `VALIDATION_ERROR` | ✔ |
| A6 | `externalId` pusty / brak | ⛔ | P3 | 400 `VALIDATION_ERROR` | ✔ |
| A7 | `serviceId` < 1 lub nienumeryczny | ⛔ | P3 | 400 `VALIDATION_ERROR` | ✔ |

### 6.2. API — przejścia statusów
| # | Scenariusz | Typ | Prio | Oczekiwany rezultat | Status |
|---|---|---|---|---|---|
| S1 | Zamknięcie z `acknowledged` | ✅ | P1 | 200, `closed` | ✔ |
| S2 | Auto-notatka po zamknięciu (widoczna w GET) | ✅ | P3 | notatka „Zmiana statusu…" | ✔ |
| S3 | Zamknięcie z `rejected` | ⛔ | P1 | 400 `STATUS_TRANSITION_ERROR` | ✔ |
| S4 | Ponowne zamknięcie `closed` | ⛔ | P1 | 400 `STATUS_TRANSITION_ERROR` | ✔ |
| S5 | Zamknięcie z `resolved` (status `new` nieosiągalny przez API) | ⛔ | P2 | 400 `STATUS_TRANSITION_ERROR` | ✔ |

### 6.3. API — notatki
| # | Scenariusz | Typ | Prio | Oczekiwany rezultat | Status |
|---|---|---|---|---|---|
| N1 | Notatka do `acknowledged` | ✅ | P2 | 201 (`id`, `text`, `date`) | ✔ |
| N2 | Notatka do `rejected` | ⛔ | P2 | 400 `NOTE_ADDITION_NOT_ALLOWED` | ✔ |
| N3 | Pusta treść notatki | ⛔ | P2 | 400 `VALIDATION_ERROR` | ✔ |
| N4 | Notatka do `closed` | ⛔ | P2 | 400 `NOTE_ADDITION_NOT_ALLOWED` | ✔ |

### 6.4. API — multi-tenancy i auth
| # | Scenariusz | Typ | Prio | Oczekiwany rezultat | Status |
|---|---|---|---|---|---|
| T1 | Dostęp do cudzego zgłoszenia | ⛔ | P1 | 404 `TROUBLE_TICKET_NOT_FOUND` (nie 403) | ✔ |
| T2 | Lista zwraca tylko własny tenant | ✅ | P1 | brak cudzych `externalId` | ✔ |
| T3 | Brak tokenu | ⛔ | P1 | 401 | ✔ |
| T4 | Niepoprawny token | ⛔ | P1 | 401 | ✔ |
| T5 | GET nieistniejącego zgłoszenia | ⛔ | P2 | 404 `TROUBLE_TICKET_NOT_FOUND` + `requestId` | ✔ |
| T6 | `serviceId` spoza zakresu 100001–100030 | ⛔/⚠ | P2 | (spec) 404 `SERVICE_NOT_FOUND` — **faktycznie 201** (sekcja 7) | ✔ |

### 6.5. UI (E2E)
| # | Scenariusz | Typ | Prio | Oczekiwany rezultat | Status |
|---|---|---|---|---|---|
| U1 | Logowanie przez Keycloak | ✅ | P1 | powrót do aplikacji, sesja aktywna | ✔ |
| U2 | Utworzenie zgłoszenia (formularz → szczegóły → lista) | ✅ | P3 | chip „Przyjęte", notatka, wiersz na liście | ✔ |
| U3 | Walidacja pustego formularza | ⛔ | P3 | komunikaty „Pole wymagane", brak nawigacji | ✔ |
| U4 | Dodanie notatki | ✅ | P3 | notatka na liście, licznik +1, snackbar | ✔ |
| U5 | Zamknięcie zgłoszenia | ✅ | P3 | chip „Zamknięte", ukryte akcje | ✔ |
| U6 | Lista — nagłówki i zgłoszenie z chipem | ✅ | P3 | poprawny render tabeli | ✔ |
| U7 | Brak wycieku danych innego tenanta | ⛔ | P1 | 404, dane beta niewidoczne dla alpha | ✔ |
| U8 | Komunikat błędu z API w snackbarze (nieaktualny stan UI) | ⛔ | P3 | snackbar z komunikatem błędu | ✔ |

**Podsumowanie pokrycia:** zaimplementowano **31 testów** (23 API + logowanie + 7 UI) obejmujących wszystkie obszary i — zgodnie z wymaganiem — wiele **ścieżek negatywnych 4xx** w obu obszarach.

---

## 7. Znalezione rozbieżności i potencjalne defekty

Podczas analizy implementacji (nie tylko specyfikacji) wykryto rozbieżności względem dokumentacji. Testy w [`tests/api/contract-gaps.spec.ts`](../tests/api/contract-gaps.spec.ts) i [`create-idempotency.spec.ts`](../tests/api/create-idempotency.spec.ts) **dokumentują stan faktyczny** i jednoznacznie go oznaczają.

1. **Status początkowy zależny od parzystości `serviceId`** *(istotne)*
   Implementacja (`ParityTicketStatusResolver`) ustawia status nowego zgłoszenia na `acknowledged` dla **parzystego** `serviceId`, a `rejected` dla **nieparzystego**. TASK.md i OpenAPI opisują wyłącznie auto-przejście na `acknowledged`. Skutek uboczny: dozwolony zakres `serviceId` 100001–100030 zawiera wartości nieparzyste — zgłoszenie utworzone z nieparzystym `serviceId` od razu trafia do stanu `rejected` (nie można go zamknąć ani dodać notatki). *Do wyjaśnienia: zachowanie celowe czy defekt?*

2. **`SERVICE_NOT_FOUND` (404) niezaimplementowany** *(istotne)*
   OpenAPI definiuje błąd `SERVICE_NOT_FOUND` dla nieistniejącej usługi, lecz backend nie weryfikuje `serviceId` względem żadnego rejestru (jedynie `>= 1`). Utworzenie z `serviceId` spoza zakresu (np. 999999) kończy się sukcesem (201) zamiast 404.

3. **Auto-notatka o zmianie statusu nieobecna w odpowiedzi PATCH** *(drobne)*
   Po zamknięciu zgłoszenia serwis zapisuje notatkę „Zmiana statusu: … -> closed", ale odpowiedź `PATCH` nie zawiera jej w polu `notes` — pojawia się dopiero w kolejnym `GET`. Niespójność reprezentacji.

4. **Niespójności dokumentacyjne** *(drobne)*
   - TASK.md deklaruje React 18, a `package.json` frontendu wskazuje React 19.
   - TASK.md odwołuje się do `docker/README.md`, którego brak (treść pokrywa główny `README.md`).
   - Numeracja reguł biznesowych w TASK.md pomija punkt „4".

---

## 8. Co dalej (poza zakresem tego zadania)

- **CI/CD** — dołączono workflow GitHub Actions ([`.github/workflows/tests.yml`](../../.github/workflows/tests.yml)) uruchamiający pełny zestaw (start `docker-compose` → testy → raport HTML jako artefakt). Dalszy krok: bramka jakości na merge i równoległe shardy.
- **Testy kontraktowe** — walidacja odpowiedzi względem schematu OpenAPI (np. `ajv`) jako automatyczny wykrywacz rozbieżności z sekcji 7.
- **Rozszerzenie ścieżek negatywnych** — pełna macierz przejść statusów, walidacja granic wszystkich pól, `additionalProperties: false`.
- **Bezpieczeństwo** — testy tokenu bez claimu `tenant_id` (oczekiwane 403), wygasłego/podmienionego tokenu, nagłówków CORS.
- **Wydajność** — podstawowe testy obciążeniowe listy i tworzenia (np. k6) — obecnie brak paginacji, co jest ryzykiem przy dużej liczbie zgłoszeń.
- **Dane testowe** — dedykowany, deterministyczny zestaw fixtures (zamiast losowych notatek w skrypcie zasiewającym).
