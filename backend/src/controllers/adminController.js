'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const { pool } = require('../config/db');

const adminController = {
  /** FZ-13: lista svih korisnika. */
  listUsers: asyncHandler(async (req, res) => {
    const { limit, offset } = req.query;
    const users = await userModel.list({ limit, offset });
    res.json({ success: true, count: users.length, data: users });
  }),

  /** FZ-13: blokiranje / odblokiranje korisnika. */
  setBlocked: asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.params.id);
    if (!user) throw ApiError.notFound('Korisnik ne postoji');
    if (user.role === 'admin') throw ApiError.forbidden('Administrator se ne može blokirati');

    const updated = await userModel.setBlocked(user.id, Boolean(req.body.blocked));
    res.json({ success: true, data: updated });
  }),

  /** FZ-13: brisanje korisnika. */
  removeUser: asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.params.id);
    if (!user) throw ApiError.notFound('Korisnik ne postoji');
    if (user.role === 'admin') throw ApiError.forbidden('Administrator se ne može obrisati');

    await userModel.remove(user.id);
    res.json({ success: true, message: 'Korisnik je obrisan' });
  }),

  /**
   * FZ-14: izvještaji i statistike (broj vožnji, rezervacija, najaktivniji
   * korisnici, prosječne ocjene, opterećenje sustava).
   */
  stats: asyncHandler(async (_req, res) => {
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                          AS total_users,
        (SELECT COUNT(*) FROM rides)                          AS total_rides,
        (SELECT COUNT(*) FROM rides WHERE status = 'active')  AS active_rides,
        (SELECT COUNT(*) FROM bookings)                       AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS confirmed_bookings,
        (SELECT ROUND(AVG(rating), 2) FROM reviews)           AS avg_rating
    `);

    const [topDrivers] = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, COUNT(r.id) AS rides_count
      FROM users u
      JOIN rides r ON r.driver_id = u.id
      GROUP BY u.id
      ORDER BY rides_count DESC
      LIMIT 5
    `);

    const [topRated] = await pool.query(`
      SELECT u.id, u.first_name, u.last_name,
             ROUND(AVG(rv.rating), 2) AS avg_rating, COUNT(rv.id) AS reviews_count
      FROM users u
      JOIN reviews rv ON rv.reviewee_id = u.id
      GROUP BY u.id
      HAVING reviews_count > 0
      ORDER BY avg_rating DESC, reviews_count DESC
      LIMIT 5
    `);

    res.json({ success: true, data: { totals, topDrivers, topRated } });
  }),
};

module.exports = adminController;
