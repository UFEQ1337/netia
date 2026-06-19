import { test, expect } from '../../src/fixtures';
import { seedAcknowledged, seedRejected } from '../../src/seed';
import { SEED_ALPHA } from '../../src/data';
import type { ApiError, TroubleTicket } from '../../src/api-client';

test.describe('API: przejścia statusów (zamykanie zgłoszeń)', () => {
  test('zamyka zgłoszenie w statusie acknowledged → 200, status closed', async ({ alphaClient }) => {
    const { externalId } = await seedAcknowledged(alphaClient);

    const res = await alphaClient.close(externalId);
    expect(res.status()).toBe(200);
    expect(((await res.json()) as TroubleTicket).status).toBe('closed');
  });

  test('zamknięcie dodaje automatyczną notatkę o zmianie statusu (widoczną po GET)', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedAcknowledged(alphaClient);

    const closeRes = await alphaClient.close(externalId);
    expect(closeRes.status()).toBe(200);

    // Uwaga: odpowiedź PATCH nie zawiera auto-notatki, ale GET już tak.
    const getRes = await alphaClient.get(externalId);
    expect(getRes.status()).toBe(200);
    const ticket = (await getRes.json()) as TroubleTicket;
    const hasStatusNote = ticket.notes.some((n) => n.text.includes('Zmiana statusu'));
    expect(hasStatusNote, 'Powinna istnieć automatyczna notatka o zmianie statusu').toBeTruthy();
  });

  test('[neg] zamknięcie zgłoszenia w statusie rejected → 400 STATUS_TRANSITION_ERROR', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedRejected(alphaClient);

    const res = await alphaClient.close(externalId);
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('STATUS_TRANSITION_ERROR');
  });

  test('[neg] ponowne zamknięcie już zamkniętego zgłoszenia → 400 STATUS_TRANSITION_ERROR', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedAcknowledged(alphaClient);
    expect((await alphaClient.close(externalId)).status()).toBe(200);

    const res = await alphaClient.close(externalId);
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('STATUS_TRANSITION_ERROR');
  });

  test('[neg] zamknięcie zgłoszenia w statusie resolved → 400 STATUS_TRANSITION_ERROR', async ({
    alphaClient,
  }) => {
    // Statusy `resolved`/`new` są nieosiągalne przez publiczne API (create rozstrzyga status
    // przez parzystość serviceId), dlatego korzystamy z deterministycznego zgłoszenia zasiewanego.
    const sanity = await alphaClient.get(SEED_ALPHA.resolved);
    expect(sanity.status(), `Brak danych zasiewanych (${SEED_ALPHA.resolved})`).toBe(200);
    expect(((await sanity.json()) as TroubleTicket).status).toBe('resolved');

    const res = await alphaClient.close(SEED_ALPHA.resolved);
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('STATUS_TRANSITION_ERROR');
  });
});
