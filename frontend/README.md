# TTAPI Frontend

Aplikacja SPA zbudowana na React 19 + TypeScript, serwowana przez Nginx.

## Wymagania

- Node.js 22+
- npm 10+
- Docker (do budowania obrazu kontenera)

---

## Uruchomienie lokalne (tryb deweloperski)

```bash
npm install
npm run dev
```

Aplikacja dostępna pod adresem: <http://localhost:5173>

---

## Dostępne skrypty npm

| Skrypt           | Opis                                                  |
|------------------|-------------------------------------------------------|
| `npm run dev`    | Serwer deweloperski Vite z hot-reload                 |
| `npm run build`  | Kompilacja produkcyjna do katalogu `dist/`            |
| `npm run preview`| Podgląd zbudowanej wersji produkcyjnej przez Vite     |
| `npm run typecheck` | Sprawdzenie typów TypeScript bez budowania        |
| `npm run lint`   | Analiza statyczna kodu przez ESLint                   |

---

## Technologie

- React 19
- TypeScript
- Vite
- MUI v7
- TanStack Router + TanStack Query
- Keycloak JS
- Nginx 1.27
