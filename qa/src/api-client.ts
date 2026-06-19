import { type APIRequestContext, type APIResponse } from '@playwright/test';

/** Ciało żądania utworzenia zgłoszenia (status domyślnie ustawiany na `new`). */
export interface CreateTicketBody {
  externalId: string;
  serviceId: number;
  description: string;
  status?: string;
  note?: string;
}

/** Notatka zgłoszenia. */
export interface Note {
  id: string;
  text: string;
  date: string;
}

/** Element listy zgłoszeń (bez notatek). */
export interface TroubleTicketSummary {
  externalId: string;
  serviceId: number;
  description: string;
  status: string;
}

/** Pełna reprezentacja zgłoszenia zwracana przez API. */
export interface TroubleTicket extends TroubleTicketSummary {
  notes: Note[];
}

/** Standardowe ciało błędu API. */
export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

/**
 * Cienki klient REST API zgłoszeń. Buduje pełne adresy URL z `baseUrl`, dzięki
 * czemu nie zależymy od reguł sklejania `baseURL` w Playwright (które gubiłyby
 * prefiks `/api/v1`). Wszystkie metody mają `failOnStatusCode: false`, więc kody
 * 4xx są zwracane normalnie i testy mogą je asertować.
 */
export class TicketClient {
  constructor(
    private readonly ctx: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** POST /troubleTicket — z domyślnym statusem `new`. */
  create(body: CreateTicketBody): Promise<APIResponse> {
    return this.ctx.post(this.url('/troubleTicket'), {
      data: { status: 'new', ...body },
      failOnStatusCode: false,
    });
  }

  /** POST /troubleTicket — dowolne (np. niepoprawne) ciało, do testów walidacji. */
  createRaw(data: unknown): Promise<APIResponse> {
    return this.ctx.post(this.url('/troubleTicket'), { data, failOnStatusCode: false });
  }

  /** GET /troubleTicket */
  list(): Promise<APIResponse> {
    return this.ctx.get(this.url('/troubleTicket'), { failOnStatusCode: false });
  }

  /** GET /troubleTicket/{externalId} */
  get(externalId: string): Promise<APIResponse> {
    return this.ctx.get(this.url(`/troubleTicket/${encodeURIComponent(externalId)}`), {
      failOnStatusCode: false,
    });
  }

  /** PATCH /troubleTicket/{externalId} — zamknięcie zgłoszenia. */
  close(externalId: string): Promise<APIResponse> {
    return this.ctx.patch(this.url(`/troubleTicket/${encodeURIComponent(externalId)}`), {
      data: { status: 'closed' },
      failOnStatusCode: false,
    });
  }

  /** POST /troubleTicket/{externalId}/note */
  addNote(externalId: string, text: string): Promise<APIResponse> {
    return this.ctx.post(this.url(`/troubleTicket/${encodeURIComponent(externalId)}/note`), {
      data: { text },
      failOnStatusCode: false,
    });
  }
}
