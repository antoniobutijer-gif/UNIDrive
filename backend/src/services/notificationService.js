'use strict';

const notificationModel = require('../models/notificationModel');

/**
 * Notifikacijski modul (FZ-12).
 * Centralizira slanje obavijesti vezanih uz rezervacije, otkazivanja i ocjene.
 * (U produkciji bi se ovdje dodatno integrirao push/WebSocket/e-mail kanal.)
 */
const notificationService = {
  async notify(userId, message) {
    try {
      await notificationModel.create({ user_id: userId, message });
    } catch (err) {
      // Notifikacija je sporedna – ne smije srušiti glavnu operaciju.
      // eslint-disable-next-line no-console
      console.error('[UNIDrive] Slanje notifikacije nije uspjelo:', err.message);
    }
  },

  // Predlošci poruka – konzistentan tekst kroz sustav
  bookingCreated(driverId, passengerName, route) {
    return this.notify(driverId, `${passengerName} je rezervirao/la mjesto na vašoj vožnji ${route}.`);
  },
  bookingConfirmed(passengerId, route) {
    return this.notify(passengerId, `Vaša rezervacija za vožnju ${route} je potvrđena.`);
  },
  bookingCancelled(driverId, passengerName, route) {
    return this.notify(driverId, `${passengerName} je otkazao/la rezervaciju na vožnji ${route}.`);
  },
  rideCancelled(passengerId, route) {
    return this.notify(passengerId, `Vožnja ${route} je otkazana. Vaša rezervacija je poništena.`);
  },
  reviewReceived(revieweeId, rating) {
    return this.notify(revieweeId, `Dobili ste novu ocjenu: ${rating}/5.`);
  },
};

module.exports = notificationService;
