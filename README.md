# TTAPI — uruchomienie w środowisku Docker

## Wymagania

- Docker Engine 24+
- Docker Compose v2 (`docker compose`)

---

## Budowanie

Zmienne konfiguracyjne (`VITE_KC_*`) są wkompilowane w aplikację frontendową podczas budowania obrazu Docker. Ich domyślne wartości zdefiniowane są w sekcji `build.args` usługi `frontend` w pliku `docker-compose.yaml`.

Z katalogu `docker` wykonujemy:

```bash
docker compose -f docker-compose.yaml build
```

Polecenie skompiluje aplikację backendową i frontendową i zbuduje dla nich obrazy dockera.

---

## Uruchomienie

```bash
cd docker/
docker compose up -d
```

Kontenery startują w kolejności wymuszonej przez health checki:

```
postgres (healthy) → keycloak (healthy, realm zaimportowany) → app
```

Pełne uruchomienie trwa ok. 60–90 sekund. Status możesz śledzić przez:

```bash
docker compose ps
docker compose logs -f app
```

---

## Zatrzymanie i czyszczenie

```bash
# Zatrzymanie kontenerów (dane w wolumenie postgres-data są zachowane)
docker compose down

# Zatrzymanie + usunięcie wolumenu z danymi bazy
docker compose down -v
```

---

## Adresy usług

| Usługa          | Adres                                            | Opis                            |
|-----------------|--------------------------------------------------|---------------------------------|
| Frontend        | http://localhost:3000                            | Aplikacja React (SPA, Nginx)    |
| API             | http://localhost:8080                            | REST API (wymaga tokenu JWT)    |
| Swagger UI      | http://localhost:8080/swagger-ui.html            | Interaktywna dokumentacja API   |
| OpenAPI YAML    | http://localhost:8080/openapi/trouble-ticket-api.yaml | Specyfikacja OpenAPI 3.1   |
| PostgreSQL      | localhost:5432                                   | Baza danych (dostęp zewnętrzny) |
| Keycloak Admin  | http://localhost:8180                            | Panel administracyjny Keycloak  |

---

## Dokumentacja API (Swagger UI)

Interaktywna dokumentacja API jest dostępna bez uwierzytelnienia pod adresem:

```
http://localhost:8080/swagger-ui.html
```

Swagger UI ładuje specyfikację bezpośrednio z pliku `trouble-ticket-api.yaml` serwowanego przez aplikację. Wszystkie endpointy są widoczne bez logowania, jednak **wywołanie** chronionych endpointów wymaga tokenu JWT.

### Autoryzacja w Swagger UI

1. Otwórz http://localhost:8080/swagger-ui.html
2. Pobierz token JWT (patrz sekcja [Pobranie tokenu JWT](#pobranie-tokenu-jwt-resource-owner-password-grant))
3. Kliknij przycisk **Authorize** (ikona kłódki) w prawym górnym rogu
4. W polu **BearerAuth** wpisz pobrany token i kliknij **Authorize**
5. Od tej chwili wszystkie żądania wysyłane przez Swagger UI będą zawierały nagłówek `Authorization: Bearer <token>`

---

## Keycloak — logowanie do panelu administracyjnego

1. Otwórz http://localhost:8180
2. Zaloguj się danymi:
   - **Login:** `admin`
   - **Hasło:** `admin`
3. Przejdź do realm **ttapi** (wybierz z listy realm w lewym górnym rogu)

W realm `ttapi` dostępni są trzej użytkownicy testowi odpowiadający tenantom z danych przykładowych:

| Użytkownik | Hasło      | Tenant (`tenant_id` w tokenie) |
|------------|------------|--------------------------------|
| `alpha` | `Test1234!` | `alpha`                    |
| `beta`  | `Test1234!` | `beta`                     |
| `gamma` | `Test1234!` | `gamma`                    |

---

## Pobranie tokenu JWT (Resource Owner Password Grant)

### curl / bash (Linux/macOS)

```bash
ACCESS_TOKEN=$(curl -s -X POST \
  http://localhost:8180/realms/ttapi/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=ttapi-client" \
  -d "username=alpha" \
  -d "password=Test1234!" | jq -r .access_token)
```

### PowerShell (Windows)

```powershell
$response = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8180/realms/ttapi/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "grant_type=password&client_id=ttapi-client&username=alpha&password=Test1234!"

$ACCESS_TOKEN = $response.access_token
```

---

## Wywołania API

Wszystkie żądania wymagają nagłówka `Authorization: Bearer <token>`.

### Lista zgłoszeń

**curl / bash:**
```bash
curl -s http://localhost:8080/api/v1/troubleTicket \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/troubleTicket" `
  -Headers @{ Authorization = "Bearer $ACCESS_TOKEN" }
```

### Pobranie szczegółów zgłoszenia

```bash
curl -s http://localhost:8080/api/v1/troubleTicket/<id> \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

### Utworzenie nowego zgłoszenia

```bash
curl -s -X POST http://localhost:8080/api/v1/troubleTicket \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "INC-9999",
    "serviceId": 1,
    "description": "Testowe zgłoszenie z curl"
  }' | jq .
```

### Dodanie notatki do zgłoszenia

```bash
curl -s -X POST http://localhost:8080/api/v1/troubleTicket/<id>/note \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "text": "Treść notatki" }' | jq .
```

### Zamknięcie zgłoszenia

```bash
curl -s -X PATCH http://localhost:8080/api/v1/troubleTicket/<id> \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "closed" }' | jq .
```

---

## Dostęp do bazy danych

Baza jest wystawiona na porcie `5432` hosta. Połącz się dowolnym klientem (DBeaver, psql, IntelliJ):

| Parametr | Wartość     |
|----------|-------------|
| Host     | `localhost` |
| Port     | `5432`      |
| Baza     | `rest_db`   |
| User     | `postgres`  |
| Hasło    | `postgres`  |

```bash
psql -h localhost -U postgres -d rest_db
```

---

## Zmienne środowiskowe

Domyślne wartości zdefiniowane są w pliku `.env`. Możesz je nadpisać eksportując zmienne przed uruchomieniem:

| Zmienna           | Domyślna wartość | Opis                      |
|-------------------|------------------|---------------------------|
| `DB_USER`         | `postgres`       | Użytkownik PostgreSQL     |
| `DB_PASSWORD`     | `postgres`       | Hasło PostgreSQL          |
| `DB_NAME`         | `rest_db`        | Nazwa bazy danych         |
| `KC_ADMIN_USER`   | `admin`          | Login admina Keycloak     |
| `KC_ADMIN_PASSWORD` | `admin`        | Hasło admina Keycloak     |
| `KC_PORT`         | `8180`           | Port Keycloak na hoście   |
