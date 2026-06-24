'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const reviewModel = require('../models/reviewModel');
const rideModel = require('../models/rideModel');
const notificationService = require('../services/notificationService');

const reviewController = {
  /**
   * FZ-11: ocjenjivanje korisnika nakon vožnje.
   * Pravila:
   *   - ocjenjivač je morao sudjelovati u vožnji,
   *   - ne može ocijeniti samog sebe,
   *   - ocjena 1–5.
   */
  create: asyncHandler(async (req, res) => {
    const reviewerId = req.user.id;
    const { reviewee_id, ride_id, rating, comment } = req.body;

    if (Number(reviewee_id) === reviewerId) {
      throw ApiError.badRequest('Ne možete ocijeniti samog sebe');
    }

    const ride = await rideModel.findById(ride_id);
    if (!ride) throw ApiError.notFound('Vožnja ne postoji');

    const reviewerParticipated = await reviewModel.userParticipatedInRide(reviewerId, ride_id);
    const revieweeParticipated = await reviewModel.userParticipatedInRide(reviewee_id, ride_id);
    if (!reviewerParticipated || !revieweeParticipated) {
      throw ApiError.forbidden('Možete ocijeniti samo sudionike zajedničke vožnje');
    }

    let review;
    try {
      review = await reviewModel.create({
        reviewer_id: reviewerId,
        reviewee_id,
        ride_id,
        rating,
        comment,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('Već ste ocijenili ovog korisnika za ovu vožnju');
      }
      throw err;
    }

    await notificationService.reviewReceived(reviewee_id, rating);
    res.status(201).json({ success: true, data: review });
  }),

  /** Ocjene koje je korisnik primio. */
  listForUser: asyncHandler(async (req, res) => {
    const reviews = await reviewModel.listForUser(req.params.id);
    res.json({ success: true, count: reviews.length, data: reviews });
  }),
};

module.exports = reviewController;
