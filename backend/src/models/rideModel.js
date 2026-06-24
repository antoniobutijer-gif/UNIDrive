'use strict';

const { pool } = require('../config/db');

const rideModel = {
  /**
   * FZ-3 / FZ-4: pretraga i filtriranje vožnji.
   * Vraća aktivne vožnje s podacima vozača i njegovom prosječnom ocjenom.
   *
   * @param {object} f filtri: origin, destination, date (YYYY-MM-DD),
   *                   preferences (array), onlyAvailable (bool)
   */
  async search(f = {}) {
    const where = ['r.status = :status'];
    const params = { status: 'active' };

    if (f.origin) {
      where.push('r.origin LIKE :origin');
      params.origin = `%${f.origin}%`;
    }
    if (f.destination) {
      where.push('r.destination LIKE :destination');
      params.destination = `%${f.destination}%`;
    }
    if (f.date) {
      where.push('DATE(r.departure_time) = :date');
      params.date = f.date;
    }
    if (f.onlyAvailable) {
      where.push('r.seats_available > 0');
    }
    // FZ-4: filtriranje po preferencijama – sve tražene moraju biti prisutne
    if (Array.isArray(f.preferences) && f.preferences.length) {
      f.preferences.forEach((pref, i) => {
        const key = `pref${i}`;
        where.push(`FIND_IN_SET(:${key}, r.preferences) > 0`);
        params[key] = pref;
      });
    }

    params.limit = Number(f.limit || 50);
    params.offset = Number(f.offset || 0);

    const [rows] = await pool.query(
      `SELECT r.*,
              u.first_name, u.last_name, u.avatar_url, u.phone AS driver_phone,
              (SELECT ROUND(AVG(rv.rating), 2) FROM reviews rv WHERE rv.reviewee_id = u.id) AS driver_rating
       FROM rides r
       JOIN users u ON u.id = r.driver_id
       WHERE ${where.join(' AND ')}
       ORDER BY r.departure_time ASC
       LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              u.first_name, u.last_name, u.avatar_url, u.phone AS driver_phone,
              (SELECT ROUND(AVG(rv.rating), 2) FROM reviews rv WHERE rv.reviewee_id = u.id) AS driver_rating
       FROM rides r
       JOIN users u ON u.id = r.driver_id
       WHERE r.id = :id`,
      { id }
    );
    return rows[0] || null;
  },

  /** FZ-7: kreiranje vožnje. */
  async create(driverId, data) {
    const [result] = await pool.query(
      `INSERT INTO rides
        (driver_id, origin, destination, departure_time, seats_available, price, preferences)
       VALUES
        (:driver_id, :origin, :destination, :departure_time, :seats_available, :price, :preferences)`,
      {
        driver_id: driverId,
        origin: data.origin,
        destination: data.destination,
        departure_time: data.departure_time,
        seats_available: data.seats_available,
        price: data.price,
        preferences: Array.isArray(data.preferences) ? data.preferences.join(',') : (data.preferences || null),
      }
    );
    return this.findById(result.insertId);
  },

  /** FZ-8: uređivanje vožnje (samo dopuštena polja). */
  async update(id, fields) {
    const allowed = ['origin', 'destination', 'departure_time', 'seats_available', 'price', 'preferences', 'status'];
    const data = { ...fields };
    if (Array.isArray(data.preferences)) data.preferences = data.preferences.join(',');

    const keys = Object.keys(data).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map((k) => `${k} = :${k}`).join(', ');
    await pool.query(`UPDATE rides SET ${setClause} WHERE id = :id`, { ...data, id });
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.query(`DELETE FROM rides WHERE id = :id`, { id });
    return result.affectedRows > 0;
  },

  /** FZ-9: pregled prijavljenih putnika na vožnji (s njihovim ocjenama). */
  async listPassengers(rideId) {
    const [rows] = await pool.query(
      `SELECT b.id AS booking_id, b.seats, b.status, b.created_at,
              u.id AS passenger_id, u.first_name, u.last_name, u.phone, u.avatar_url,
              (SELECT ROUND(AVG(rv.rating), 2) FROM reviews rv WHERE rv.reviewee_id = u.id) AS passenger_rating
       FROM bookings b
       JOIN users u ON u.id = b.passenger_id
       WHERE b.ride_id = :rideId AND b.status <> 'cancelled'
       ORDER BY b.created_at ASC`,
      { rideId }
    );
    return rows;
  },

  /** FZ-10: povijest vožnji u kojima je korisnik sudjelovao kao vozač. */
  async listByDriver(driverId) {
    const [rows] = await pool.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.id AND b.status <> 'cancelled') AS bookings_count
       FROM rides r
       WHERE r.driver_id = :driverId
       ORDER BY r.departure_time DESC`,
      { driverId }
    );
    return rows;
  },
};

module.exports = rideModel;
