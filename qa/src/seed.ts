import { expect } from '@playwright/test';
import type { TicketClient, TroubleTicket } from './api-client';
import { EVEN_SERVICE_ID, ODD_SERVICE_ID, uniqueExternalId } from './data';

export interface SeededTicket {
  externalId: string;
  ticket: TroubleTicket;
}

/**
 * Tworzy zgłoszenie w statusie `acknowledged` (parzysty serviceId).
 * Taki stan pozwala je później zamknąć oraz dodawać notatki.
 */
export async function seedAcknowledged(
  client: TicketClient,
  note = 'Notatka inicjalna QA',
): Promise<SeededTicket> {
  const externalId = uniqueExternalId();
  const res = await client.create({
    externalId,
    serviceId: EVEN_SERVICE_ID,
    description: `Zgłoszenie QA ${externalId}`,
    note,
  });
  expect(res.status(), 'Seed: utworzenie zgłoszenia (acknowledged)').toBe(201);
  const ticket = (await res.json()) as TroubleTicket;
  expect(ticket.status, 'Seed: parzysty serviceId daje status acknowledged').toBe('acknowledged');
  return { externalId, ticket };
}

/**
 * Tworzy zgłoszenie w statusie `rejected` (nieparzysty serviceId).
 * Taki stan blokuje zamknięcie i dodawanie notatek — przydatne do ścieżek negatywnych.
 */
export async function seedRejected(client: TicketClient): Promise<SeededTicket> {
  const externalId = uniqueExternalId();
  const res = await client.create({
    externalId,
    serviceId: ODD_SERVICE_ID,
    description: `Zgłoszenie QA ${externalId}`,
  });
  expect(res.status(), 'Seed: utworzenie zgłoszenia (rejected)').toBe(201);
  const ticket = (await res.json()) as TroubleTicket;
  expect(ticket.status, 'Seed: nieparzysty serviceId daje status rejected').toBe('rejected');
  return { externalId, ticket };
}
