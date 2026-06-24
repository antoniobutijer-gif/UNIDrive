'use strict';

const { pool } = require('../config/db');

const reviewModel = {
  /** FZ-11: pohrana ocjene. */
  async create({ reviewer_id, reviewee_id, ride_id, rating, comment = null }) {
    const [result] = await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewee_id, ride_id, rating, comment)
       VALUES (:reviewer_id, :reviewee_id, :ride_id, :rating, :comment)`,
      { reviewer_id, reviewee_id, ride_id, rating, comment }
    );
    const [rows] = await pool.query(`SELECT * FROM reviews WHERE id = :id`, { id: result.insertId });
    return rows[0];
  },

  /** Ocjene koje je korisnik primio (s imenom ocjenjivača). */
  async listForUser(userId) {
    const [rows] = await pool.query(
      `SELECT rv.*, u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       WHERE rv.reviewee_id = :userId
       ORDER BY rv.created_at DESC`,
      { userId }
    );
    return rows;
  },

  /** Provjera je li korisnik sudjelovao u vožnji (vozač ili potvrđeni putnik). */
  async userParticipatedInRide(userId, rideId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM rides WHERE id = :rideId AND driver_id = :userId
       UNION
       SELECT 1 FROM bookings WHERE ride_id = :rideId AND passenger_id = :userId AND status <> 'cancelled'
       LIMIT 1`,
      { rideId, userId }
    );
    return rows.length > 0;
  },
};

module.exports = reviewModel;
