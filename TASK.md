# Zadanie rekrutacyjne: Tester automatyzacji

## Wprowadzenie

Przed Tobą aplikacja **Trouble Ticket API** — system do zarządzania zgłoszeniami serwisowymi. Aplikacja składa się z:

- **Backend API** (REST, OpenAPI 3.1) — Spring Boot 4.0.5, Java 21
- **Frontend** (SPA) — React 18, TypeScript, Material UI v7
- **Uwierzytelnianie** — Keycloak (OAuth2/OIDC, Bearer Token)
- **Baza danych** — PostgreSQL 18

Twoim zadaniem jest zaprojektowanie strategii testów oraz implementacja przykładowych scenariuszy testowych.

---

## Opis funkcjonalny aplikacji

### Główne funkcje

| Obszar | Opis |
|--------|------|
| **Tworzenie zgłoszeń** | Klient API może utworzyć nowe zgłoszenie Trouble Ticket |
| **Przeglądanie zgłoszeń** | Lista zgłoszeń oraz szczegóły pojedynczego zgłoszenia |
| **Zamykanie zgłoszeń** | Klient może zamknąć zgłoszenie będące w odpowiednim statusie |
| **Notatki** | Dodawanie notatek do aktywnych zgłoszeń |
| **Multi-tenancy** | Izolacja danych między tenantami (operatorami) |

### Endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/v1/troubleTicket` | Utwórz zgłoszenie |
| `GET` | `/api/v1/troubleTicket` | Lista zgłoszeń |
| `GET` | `/api/v1/troubleTicket/{id}` | Szczegóły zgłoszenia |
| `PATCH` | `/api/v1/troubleTicket/{id}` | Zamknij zgłoszenie |
| `POST` | `/api/v1/troubleTicket/{id}/note` | Dodaj notatkę |

### Funkcje UI (Frontend)

- Widok listy zgłoszeń z oznaczeniem statusów
- Formularz tworzenia nowego zgłoszenia
- Widok szczegółów zgłoszenia z historią notatek
- Zamykanie zgłoszenia (przycisk akcji)
- Dodawanie notatek do zgłoszenia

---

## Reguły biznesowe

### 1. Statusy zgłoszeń

System obsługuje następujące statusy:

| Status | Opis |
|--------|------|
| `new` | Nowo utworzone zgłoszenie |
| `acknowledged` | Zgłoszenie przyjęte do realizacji |
| `inProgress` | Zgłoszenie w trakcie obsługi |
| `resolved` | Zgłoszenie rozwiązane (oczekuje na potwierdzenie) |
| `closed` | Zgłoszenie zamknięte |
| `rejected` | Zgłoszenie odrzucone |

### 2. Dozwolone przejścia statusów

**Tworzenie zgłoszenia:**
- Klient API może przekazać **wyłącznie** status `new`
- Po utworzeniu system może automatycznie zmienić status na `acknowledged`

**Zamykanie zgłoszenia przez klienta API:**
- Dozwolone **wyłącznie** przejście na status `closed`
- Zamknięcie możliwe **tylko** z statusów: `acknowledged` lub `inProgress`
- Próba zamknięcia z innego statusu zwraca błąd `STATUS_TRANSITION_ERROR`

```
┌─────────┐
│   new   │ ──────────────────────────────────────┐
└────┬────┘                                       │
     │ (auto)                                     │
     ▼                                            │
┌────────────┐     ┌────────────┐                 │
│acknowledged│────▶│ inProgress │                 │
└─────┬──────┘     └──────┬─────┘                 │
      │                   │                       │
      │    ┌──────────────┤                       │
      │    │              │                       │
      ▼    ▼              ▼                       ▼
┌─────────────┐    ┌──────────┐           ┌──────────┐
│   closed    │    │ resolved │           │ rejected │
└─────────────┘    └──────────┘           └──────────┘
    (API)           (system)                (system)
```

### 3. Notatki

- Notatki można dodawać do zgłoszeń w statusach: `new`, `acknowledged`, `inProgress`
- **Nie można** dodać notatki do zgłoszenia w statusie: `resolved`, `closed`, `rejected`
- Próba dodania notatki do zamkniętego zgłoszenia zwraca błąd `NOTE_ADDITION_NOT_ALLOWED`

### 5. Idempotencja tworzenia

- Para `(tenantId, externalId)` musi być unikalna
- Próba utworzenia zgłoszenia z istniejącym `externalId` w tym samym tenancie zwraca **HTTP 200** z istniejącym zasobem (zamiast 201)

### 6. Multi-tenancy (izolacja danych)

- Każdy użytkownik należy do jednego tenanta
- Tenant scope wynika **wyłącznie** z Bearer tokenu (claim `tenant_id`)
- Użytkownik widzi **tylko** zgłoszenia swojego tenanta
- Próba dostępu do zasobu innego tenanta zwraca **HTTP 404** (nie 403)

---

## Kody błędów API

| Kod | HTTP | Opis |
|-----|------|------|
| `VALIDATION_ERROR` | 400 | Błąd walidacji danych wejściowych |
| `STATUS_TRANSITION_ERROR` | 400 | Niedozwolone przejście statusu |
| `NOTE_ADDITION_NOT_ALLOWED` | 400 | Notatka niedozwolona w bieżącym statusie |
| `SERVICE_NOT_FOUND` | 404 | Usługa nie istnieje lub nie należy do tenanta |
| `TROUBLE_TICKET_NOT_FOUND` | 404 | Zgłoszenie nie istnieje lub nie jest widoczne |
| `UNAUTHORIZED` | 401 | Brak lub niepoprawny token |
| `FORBIDDEN` | 403 | Brak uprawnień do operacji |

---

## Dane testowe

### Użytkownicy (Keycloak)

| Username | Hasło | Tenant |
|----------|-------|--------|
| `alpha` | `Test1234!` | alpha |
| `beta` | `Test1234!` | beta |
| `gamma` | `Test1234!` | gamma |

### Predefiniowane zgłoszenia

Baza danych zawiera **30 przykładowych zgłoszeń** (po ~10 na każdego tenanta) z różnymi statusami i notatkami. Możesz je wykorzystać lub tworzyć własne dane testowe (fixtures).

### Poprawne serviceId

W środowisku testowym akceptowane są wartości: **100001 – 100030**

---

## Środowisko uruchomieniowe

Całe środowisko uruchamiane jest przez Docker Compose (szczegółowy opis uruchomienia znajduje się w pliku `docker/README.md`):

```bash
# 1. Zbuduj obrazy Docker
cd docker
docker compose -f docker-compose.yaml build

# 2. Uruchom środowisko
docker compose up -d
```

**Usługi:**

| Usługa | Adres | Opis |
|--------|-------|------|
| Frontend | http://localhost:3000 | Aplikacja React (SPA, Nginx) |
| API Backend | http://localhost:8080 | REST API |
| Keycloak | http://localhost:8180 | Serwer autoryzacji |
| PostgreSQL | localhost:5432 | Baza danych |

**Uzyskanie tokenu (przykład curl):**

```bash
curl -X POST http://localhost:8180/realms/ttapi/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=ttapi-client" \
  -d "username=alpha" \
  -d "password=Test1234!"
```

---

## Wymagania zadania

### Część 1: Strategia testów (dokument)

Przygotuj **strategię testów** dla aplikacji Trouble Ticket (3-4 strony). Dokument powinien zawierać:

1. **Identyfikację obszarów do testowania** — jakie komponenty/funkcje wymagają pokrycia testami
2. **Priorytetyzację** — które obszary są krytyczne, a które mniej istotne
3. **Podejście do testowania** — jakie typy testów zastosujesz i dlaczego
4. **Ryzyka i wyzwania** — potencjalne problemy i sposoby ich mitygacji
5. **Propozycję scenariuszy testowych** — lista scenariuszy z podziałem na obszary

> **Uwaga:** Kompleksowe podejście do testowania jest elementem oceny.

### Część 2: Implementacja scenariuszy (kod)

Zaimplementuj **minimum 2 scenariusze testowe** z różnych obszarów (API i UI). Przykładowe scenariusze:

- **1 scenariusz testujący API** (np. walidacja, przejścia statusów, izolacja tenantów)
- **1 scenariusz testujący UI** (np. formularz, interakcja z listą, wyświetlanie danych)

**Wymagania:**
- Scenariusze muszą pochodzić z **różnych obszarów** testowych
- **Obowiązkowo** uwzględnij co najmniej jedną **negatywną ścieżkę** (błąd 4xx)
- Testy mają działać względem uruchomionego środowiska (docker-compose)

---

## Sugerowane technologie

Możesz użyć dowolnych narzędzi, ale preferujemy rozwiązania oparte o języki Java i TypeScript, które są zgodne z technologiami użytymi w aplikacji.
---

## Kryteria oceny

| Kryterium | Waga |
|-----------|------|
| **Jakość kodu testów** | Czytelność, organizacja, reużywalność |
| **Kompletność strategii** | Pokrycie obszarów, logiczna struktura |
| **Kreatywność scenariuszy** | Nietypowe przypadki, edge cases |
| **Dokumentacja** | Jasność opisu, instrukcje uruchomienia |
| **Znajomość narzędzi** | Poprawne użycie frameworków |
| **Obsługa błędów/edge cases** | Negatywne ścieżki, walidacja granic |

---

## Forma dostarczenia

- **Format:** Archiwum ZIP zawierające repozytorium git
- **Zawartość:**
  - Dokument strategii testów (Markdown)
  - Kod źródłowy testów
  - README z instrukcją uruchomienia testów
- **Termin:** ~2 tygodnie od otrzymania zadania

---

## Materiały referencyjne

W repozytorium znajdziesz:

- `src/main/openapi/trouble-ticket-api.yaml` — pełna specyfikacja OpenAPI
- `docker/README.md` — instrukcja uruchomienia środowiska
- `docker/keycloak/realm-ttapi.json` — konfiguracja Keycloak (użytkownicy, klient)
- `src/main/resources/db/changelog/sql/` — skrypty migracji bazy danych

---

## Kontakt

W przypadku pytań technicznych dotyczących środowiska lub niejasności w specyfikacji, skontaktuj się z rekruterem.

**Powodzenia!**
