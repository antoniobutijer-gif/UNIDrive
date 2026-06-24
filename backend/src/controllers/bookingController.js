'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bookingModel = require('../models/bookingModel');
const notificationService = require('../services/notificationService');

const bookingController = {
  /** FZ-10: vlastite rezervacije (kao putnik). */
  listMine: asyncHandler(async (req, res) => {
    const bookings = await bookingModel.listByPassenger(req.user.id);
    res.json({ success: true, count: bookings.length, data: bookings });
  }),

  /** FZ-6: otkazivanje rezervacije (samo vlasnik rezervacije). */
  cancel: asyncHandler(async (req, res) => {
    const booking = await bookingModel.findById(req.params.id);
    if (!booking) throw ApiError.notFound('Rezervacija ne postoji');
    if (booking.passenger_id !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('Možete otkazati samo vlastite rezervacije');
    }

    const updated = await bookingModel.cancelWithTransaction(booking.id);

    // FZ-12: obavijesti vozača o otkazivanju
    const route = `${booking.origin} → ${booking.destination}`;
    const passengerName = `${req.user.first_name} ${req.user.last_name}`;
    await notificationService.bookingCancelled(booking.driver_id, passengerName, route);

    res.json({ success: true, data: updated });
  }),
};

module.exports = bookingController;
