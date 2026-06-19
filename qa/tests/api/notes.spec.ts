import { test, expect } from '../../src/fixtures';
import { seedAcknowledged, seedRejected } from '../../src/seed';
import type { ApiError, Note } from '../../src/api-client';

test.describe('API: notatki', () => {
  test('dodaje notatkę do zgłoszenia w statusie acknowledged → 201 (id, text, date)', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedAcknowledged(alphaClient);

    const res = await alphaClient.addNote(externalId, 'Dodatkowa notatka QA');
    expect(res.status()).toBe(201);

    const note = (await res.json()) as Note;
    expect(note.id).toBeTruthy();
    expect(note.text).toBe('Dodatkowa notatka QA');
    expect(note.date).toBeTruthy();
  });

  test('[neg] notatka do zgłoszenia w statusie rejected → 400 NOTE_ADDITION_NOT_ALLOWED', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedRejected(alphaClient);

    const res = await alphaClient.addNote(externalId, 'Notatka niedozwolona');
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('NOTE_ADDITION_NOT_ALLOWED');
  });

  test('[neg] pusta treść notatki → 400 VALIDATION_ERROR', async ({ alphaClient }) => {
    const { externalId } = await seedAcknowledged(alphaClient);

    const res = await alphaClient.addNote(externalId, '');
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('VALIDATION_ERROR');
  });

  test('[neg] notatka do zgłoszenia w statusie closed → 400 NOTE_ADDITION_NOT_ALLOWED', async ({
    alphaClient,
  }) => {
    const { externalId } = await seedAcknowledged(alphaClient);
    expect((await alphaClient.close(externalId)).status()).toBe(200); // acknowledged -> closed

    const res = await alphaClient.addNote(externalId, 'Notatka do zamkniętego zgłoszenia');
    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiError).code).toBe('NOTE_ADDITION_NOT_ALLOWED');
  });
});
