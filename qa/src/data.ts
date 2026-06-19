/**
 * Generatory i stałe danych testowych.
 *
 * Kluczowa reguła wynikająca z implementacji backendu
 * (`ParityTicketStatusResolver`): status początkowy nowo utworzonego zgłoszenia
 * zależy od PARZYSTOŚCI `serviceId`:
 *   - parzysty  serviceId -> status `acknowledged` (można zamykać i dodawać notatki),
 *   - nieparzysty serviceId -> status `rejected`   (NIE można zamknąć ani dodać notatki).
 * To zachowanie odbiega od opisu w TASK.md / OpenAPI (które wspominają tylko o
 * `acknowledged`) — patrz dokument strategii, sekcja "rozbieżności".
 */

let counter = 0;

/** Generuje unikalny externalId, aby testy były niezależne między uruchomieniami. */
export function uniqueExternalId(prefix = 'QA'): string {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${ts}-${counter}-${rand}`;
}

/** Parzysty serviceId z dozwolonego zakresu (100001–100030) -> status `acknowledged`. */
export const EVEN_SERVICE_ID = 100002;

/** Nieparzysty serviceId z dozwolonego zakresu -> status `rejected`. */
export const ODD_SERVICE_ID = 100001;

/** serviceId spoza dozwolonego zakresu testowego (100001–100030). */
export const OUT_OF_RANGE_SERVICE_ID = 999999;

/**
 * Referencje do danych zasiewanych (seed) — kolejność i statusy są deterministyczne
 * (skrypt 005), ale LICZBA notatek jest losowa, więc nie należy asertować jej dokładnej
 * wartości. Mapa przydatna do scenariuszy tylko-do-odczytu.
 * Dla tenanta `alpha` (zgłoszenia o indeksach 1,4,7,...):
 */
export const SEED_ALPHA = {
  acknowledged: 'TT-2026-0001',
  closed: 'TT-2026-0004',
  inProgress: 'TT-2026-0007',
  rejected: 'TT-2026-0010',
  resolved: 'TT-2026-0013',
} as const;
