import { test, expect } from '../../src/fixtures';
import { EVEN_SERVICE_ID, ODD_SERVICE_ID, uniqueExternalId } from '../../src/data';
import type { ApiError, TroubleTicket } from '../../src/api-client';

test.describe('API: tworzenie zgłoszeń i idempotencja', () => {
  test('parzysty serviceId → 201, status acknowledged, nagłówek Location i notatka inicjalna', async ({
    alphaClient,
  }) => {
    const externalId = uniqueExternalId();
    const res = await alphaClient.create({
      externalId,
      serviceId: EVEN_SERVICE_ID,
      description: 'Brak transmisji danych dla usługi klienta',
      note: 'Pierwsza notatka',
    });

    expect(res.status()).toBe(201);
    expect(res.headers()['location']).toContain(externalId);

    const body = (await res.json()) as TroubleTicket;
    expect(body.externalId).toBe(externalId);
    expect(body.status).toBe('acknowledged');
    expect(body.notes).toHaveLength(1);
    expect(body.notes[0].text).toBe('Pierwsza notatka');
  });

  test('nieparzysty serviceId → status rejected (rozbieżność ze specyfikacją — udokumentowana)', async ({
    alphaClient,
  }) => {
    const externalId = uniqueExternalId();
    const res = await alphaClient.create({
      externalId,
      serviceId: ODD_SERVICE_ID,
      description: 'Zgłoszenie z nieparzystym serviceId',
    });

    expect(res.status()).toBe(201);
    const body = (await res.json()) as TroubleTicket;
    // TASK.md / OpenAPI opisują auto-przejście tylko na `acknowledged`, lecz implementacja
    // (ParityTicketStatusResolver) zwraca `rejected` dla nieparzystego serviceId.
    expect(body.status).toBe('rejected');
  });

  test('ponowne utworzenie z tym samym (tenant, externalId) jest idempotentne → 200 z istniejącym zasobem', async ({
    alphaClient,
  }) => {
    const externalId = uniqueExternalId();
    const first = await alphaClient.create({
      externalId,
      serviceId: EVEN_SERVICE_ID,
      description: 'Pierwsze utworzenie',
    });
    expect(first.status()).toBe(201);

    const second = await alphaClient.create({
      externalId,
      serviceId: EVEN_SERVICE_ID,
      description: 'Druga próba — powinna zwrócić istniejące',
    });
    expect(second.status()).toBe(200);
    const body = (await second.json()) as TroubleTicket;
    expect(body.externalId).toBe(externalId);
    // Zwracany jest oryginalny opis (zasób istniejący), nie nowy z drugiego żądania.
    expect(body.description).toBe('Pierwsze utworzenie');
  });

  test('[neg] brak wymaganego pola description → 400 VALIDATION_ERROR', async ({ alphaClient }) => {
    const res = await alphaClient.createRaw({
      externalId: uniqueExternalId(),
      serviceId: EVEN_SERVICE_ID,
      status: 'new',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });

  test('[neg] status inny niż "new" w żądaniu utworzenia → 400 VALIDATION_ERROR', async ({
    alphaClient,
  }) => {
    const res = await alphaClient.createRaw({
      externalId: uniqueExternalId(),
      serviceId: EVEN_SERVICE_ID,
      description: 'Próba ustawienia niedozwolonego statusu',
      status: 'closed',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });

  test('[neg] pusty externalId → 400 VALIDATION_ERROR', async ({ alphaClient }) => {
    const res = await alphaClient.createRaw({
      externalId: '',
      serviceId: EVEN_SERVICE_ID,
      description: 'Pusty externalId',
      status: 'new',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });

  test('[neg] serviceId poniżej minimum (0) → 400 VALIDATION_ERROR', async ({ alphaClient }) => {
    const res = await alphaClient.createRaw({
      externalId: uniqueExternalId(),
      serviceId: 0,
      description: 'serviceId poniżej minimum',
      status: 'new',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });

  test('[neg] nienumeryczny serviceId → 400 VALIDATION_ERROR', async ({ alphaClient }) => {
    const res = await alphaClient.createRaw({
      externalId: uniqueExternalId(),
      serviceId: 'abc',
      description: 'serviceId nienumeryczny',
      status: 'new',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });
});
