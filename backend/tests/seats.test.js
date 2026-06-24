'use strict';

/**
 * Jedinično testiranje (Jest) – pogl. 7.5 dokumentacije.
 * Testira poslovnu logiku izračuna slobodnih mjesta nakon rezervacije /
 * otkazivanja, neovisno o bazi podataka.
 */

const { applyBooking, applyCancellation } = require('../src/utils/seats');

describe('Izračun slobodnih mjesta (FZ-5 / FZ-6)', () => {
  test('umanjuje broj mjesta nakon uspješne rezervacije', () => {
    expect(applyBooking(3, 1)).toBe(2);
    expect(applyBooking(3, 2)).toBe(1);
  });

  test('baca grešku kada nema dovoljno mjesta', () => {
    expect(() => applyBooking(1, 2)).toThrow();
    expect(() => applyBooking(0, 1)).toThrow();
  });

  test('vraća mjesto u vožnju nakon otkazivanja', () => {
    expect(applyCancellation(1, 1)).toBe(2);
    expect(applyCancellation(0, 2)).toBe(2);
  });
});
