'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const rideModel = require('../models/rideModel');
const bookingModel = require('../models/bookingModel');
const notificationService = require('../services/notificationService');

/** Pomoćna: "Lapad → Kampus" string za poruke. */
const routeStr = (ride) => `${ride.origin} → ${ride.destination}`;

const rideController = {
  /** FZ-3 / FZ-4: pretraga i filtriranje dostupnih vožnji. */
  search: asyncHandler(async (req, res) => {
    const { origin, destination, date, preferences, available, limit, offset } = req.query;
    const prefList = preferences
      ? String(preferences).split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    const rides = await rideModel.search({
      origin,
      destination,
      date,
      preferences: prefList,
      onlyAvailable: available === undefined ? true : available === 'true',
      limit,
      offset,
    });
    res.json({ success: true, count: rides.length, data: rides });
  }),

  getOne: asyncHandler(async (req, res) => {
    const ride = await rideModel.findById(req.params.id);
    if (!ride) throw ApiError.notFound('Vožnja ne postoji');
    res.json({ success: true, data: ride });
  }),

  /** FZ-7: kreiranje vožnje (samo prijavljeni student). */
  create: asyncHandler(async (req, res) => {
    const ride = await rideModel.create(req.user.id, req.body);
    res.status(201).json({ success: true, data: ride });
  }),

  /** FZ-8: uređivanje vožnje (samo vozač vlasnik). */
  update: asyncHandler(async (req, res) => {
    const ride = await rideModel.findById(req.params.id);
    if (!ride) throw ApiError.notFound('Vožnja ne postoji');
    if (ride.driver_id !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('Možete uređivati samo vlastite vožnje');
    }
    const updated = await rideModel.update(ride.id, req.body);
    res.json({ success: true, data: updated });
  }),

  /**
   * FZ-8: brisanje vožnje. Prije brisanja obavještava sve putnike i poništava
   * njihove rezervacije (kaskadno brisanje u bazi briše bookings zapise).
   */
  remove: asyncHandler(async (req, res) => {
    const ride = await rideModel.findById(req.params.id);
    if (!ride) throw ApiError.notFound('Vožnja ne postoji');
    if (ride.driver_id !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('Možete brisati samo vlastite vožnje');
    }

    const passengers = await rideModel.listPassengers(ride.id);
    await rideModel.remove(ride.id);

    // FZ-12: obavijesti sve putnike o otkazivanju
    await Promise.all(
      passengers.map((p) => notificationService.rideCancelled(p.passenger_id, routeStr(ride)))
    );

    res.json({ success: true, message: 'Vožnja je obrisana i putnici su obaviješteni.' });
  }),

  /** FZ-9: pregled prijavljenih putnika (samo vozač vlasnik / admin). */
  listPassengers: asyncHandler(async (req, res) => {
    const ride = await rideModel.findById(req.params.id);
    if (!ride) throw ApiError.notFound('Vožnja ne postoji');
    if (ride.driver_id !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('Samo vozač može vidjeti prijavljene putnike');
    }
    const passengers = await rideModel.listPassengers(ride.id);
    res.json({ success: true, count: passengers.length, data: passengers });
  }),

  /**
   * FZ-5: rezervacija mjesta na vožnji. Transakcijski (vidi bookingModel).
   * Obavještava vozača i putnika (FZ-12).
   */
  book: asyncHandler(async (req, res) => {
    const rideId = Number(req.params.id);
    const seats = Number(req.body.seats || 1);

    const { booking, ride } = await bookingModel.createWithTransaction({
      rideId,
      passengerId: req.user.id,
      seats,
    });

    const route = routeStr(ride);
    const passengerName = `${req.user.first_name} ${req.user.last_name}`;
    await notificationService.bookingCreated(ride.driver_id, passengerName, route);
    await notificationService.bookingConfirmed(req.user.id, route);

    res.status(201).json({ success: true, data: booking });
  }),
};

module.exports = rideController;
