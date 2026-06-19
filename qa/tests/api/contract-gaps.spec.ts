import { test, expect } from '../../src/fixtures';
import { OUT_OF_RANGE_SERVICE_ID, uniqueExternalId } from '../../src/data';
import type { ApiError, TroubleTicket } from '../../src/api-client';

/**
 * Testy dokumentujące rozbieżności między kontraktem (OpenAPI/TASK) a implementacją.
 * Asercje opisują STAN FAKTYCZNY — w razie naprawy defektu test zacznie padać i wymusi aktualizację.
 */
test.describe('API: rozbieżności kontrakt ↔ implementacja', () => {
  test('serviceId spoza zakresu 100001–100030 NIE zwraca SERVICE_NOT_FOUND — zgłoszenie jest tworzone (luka)', async ({
    alphaClient,
  }) => {
    const externalId = uniqueExternalId();
    const res = await alphaClient.create({
      externalId,
      serviceId: OUT_OF_RANGE_SERVICE_ID,
      description: 'serviceId poza dozwolonym zakresem testowym',
    });

    // OpenAPI definiuje błąd SERVICE_NOT_FOUND (404), ale backend nie weryfikuje
    // istnienia usługi — zgłoszenie zostaje utworzone (201).
    expect(res.status()).toBe(201);
    expect(((await res.json()) as TroubleTicket).externalId).toBe(externalId);
  });

  test('GET nieistniejącego zgłoszenia → 404 TROUBLE_TICKET_NOT_FOUND z polem requestId', async ({
    alphaClient,
  }) => {
    const res = await alphaClient.get(`NIE-ISTNIEJE-${uniqueExternalId()}`);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as ApiError;
    expect(body.code).toBe('TROUBLE_TICKET_NOT_FOUND');
    expect(body.requestId).toBeTruthy();
  });
});
