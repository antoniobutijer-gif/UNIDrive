'use strict';

/**
 * Čista poslovna logika izračuna slobodnih mjesta (testirana Jestom).
 * Drži se odvojeno od baze kako bi se mogla jedinično testirati (pogl. 7.5).
 */

/**
 * Vraća novi broj slobodnih mjesta nakon rezervacije.
 * @throws {Error} ako nema dovoljno slobodnih mjesta.
 */
function applyBooking(seatsAvailable, requested = 1) {
  if (requested < 1) throw new Error('Broj traženih mjesta mora biti najmanje 1');
  if (seatsAvailable < requested) throw new Error('Nema dovoljno slobodnih mjesta');
  return seatsAvailable - requested;
}

/**
 * Vraća novi broj slobodnih mjesta nakon otkazivanja rezervacije.
 */
function applyCancellation(seatsAvailable, seatsToRelease = 1) {
  if (seatsToRelease < 1) throw new Error('Broj mjesta za vraćanje mora biti najmanje 1');
  return seatsAvailable + seatsToRelease;
}

module.exports = { applyBooking, applyCancellation };
