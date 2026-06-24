'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const rideModel = require('../models/rideModel');
const bookingModel = require('../models/bookingModel');
const reviewModel = require('../models/reviewModel');

const userController = {
  /** FZ-2: dohvat vlastitog profila. */
  getProfile: asyncHandler(async (req, res) => {
    const summary = await userModel.getRatingSummary(req.user.id);
    res.json({ success: true, data: { ...req.user, ...summary } });
  }),

  /** FZ-2: ažuriranje vlastitog profila. */
  updateProfile: asyncHandler(async (req, res) => {
    const { first_name, last_name, phone, avatar_url, ride_pref } = req.body;
    const updated = await userModel.update(req.user.id, {
      first_name,
      last_name,
      phone,
      avatar_url,
      ride_pref,
    });
    res.json({ success: true, data: updated });
  }),

  /** Javni profil korisnika + njegove ocjene (FZ-9 / FZ-11). */
  getPublicProfile: asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.params.id);
    if (!user) throw ApiError.notFound('Korisnik ne postoji');
    const summary = await userModel.getRatingSummary(user.id);
    const reviews = await reviewModel.listForUser(user.id);
    res.json({ success: true, data: { ...user, ...summary, reviews } });
  }),

  /** FZ-10: povijest vožnji – kao vozač i kao putnik. */
  getHistory: asyncHandler(async (req, res) => {
    const asDriver = await rideModel.listByDriver(req.user.id);
    const asPassenger = await bookingModel.listByPassenger(req.user.id);
    res.json({ success: true, data: { asDriver, asPassenger } });
  }),
};

module.exports = userController;
