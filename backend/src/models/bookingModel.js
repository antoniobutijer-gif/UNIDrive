'use strict';

const { pool, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { applyBooking, applyCancellation } = require('../utils/seats');

const bookingModel = {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT b.*, r.driver_id, r.origin, r.destination, r.departure_time
       FROM bookings b
       JOIN rides r ON r.id = b.ride_id
       WHERE b.id = :id`,
      { id }
    );
    return rows[0] || null;
  },

  /**
   * FZ-5: kreiranje rezervacije unutar MySQL transakcije.
   *
   * Atomarno:
   *   1. zaključa redak vožnje (SELECT ... FOR UPDATE),
   *   2. provjeri ima li dovoljno slobodnih mjesta,
   *   3. ubaci rezervaciju,
   *   4. umanji `seats_available`.
   * Time se sprječava preklapanje rezervacija (race conditions) – vidi
   * dokumentaciju, pogl. 7.2 (Napomena za programere).
   *
   * @returns {Promise<{booking:object, ride:object}>}
   */
  async createWithTransaction({ rideId, passengerId, seats = 1 }) {
    return withTransaction(async (conn) => {
      const [rideRows] = await conn.query(
        `SELECT id, driver_id, origin, destination, seats_available, status
         FROM rides WHERE id = :rideId FOR UPDATE`,
        { rideId }
      );
      const ride = rideRows[0];

      if (!ride) throw ApiError.notFound('Vožnja ne postoji');
      if (ride.status !== 'active') throw ApiError.conflict('Vožnja više nije aktivna');
      if (ride.driver_id === passengerId) {
        throw ApiError.badRequest('Vozač ne može rezervirati vlastitu vožnju');
      }

      // Poslovna logika izračuna mjesta (jedinstven izvor istine, testirano Jestom)
      let newSeats;
      try {
        newSeats = applyBooking(ride.seats_available, seats);
      } catch (_e) {
        throw ApiError.conflict('Nema dovoljno slobodnih mjesta');
      }

      let bookingId;
      try {
        const [ins] = await conn.query(
          `INSERT INTO bookings (ride_id, passenger_id, seats, status)
           VALUES (:rideId, :passengerId, :seats, 'confirmed')`,
          { rideId, passengerId, seats }
        );
        bookingId = ins.insertId;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw ApiError.conflict('Već imate rezervaciju za ovu vožnju');
        }
        throw err;
      }

      await conn.query(
        `UPDATE rides SET seats_available = :newSeats WHERE id = :rideId`,
        { newSeats, rideId }
      );

      const [bRows] = await conn.query(`SELECT * FROM bookings WHERE id = :id`, { id: bookingId });
      return { booking: bRows[0], ride };
    });
  },

  /**
   * FZ-6: otkazivanje rezervacije – vraća mjesto u vožnju (atomarno).
   */
  async cancelWithTransaction(bookingId) {
    return withTransaction(async (conn) => {
      const [rows] = await conn.query(
        `SELECT * FROM bookings WHERE id = :bookingId FOR UPDATE`,
        { bookingId }
      );
      const booking = rows[0];
      if (!booking) throw ApiError.notFound('Rezervacija ne postoji');
      if (booking.status === 'cancelled') {
        throw ApiError.conflict('Rezervacija je već otkazana');
      }

      await conn.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = :bookingId`,
        { bookingId }
      );
      const [rideRows] = await conn.query(
        `SELECT seats_available FROM rides WHERE id = :rideId FOR UPDATE`,
        { rideId: booking.ride_id }
      );
      const newSeats = applyCancellation(rideRows[0].seats_available, booking.seats);
      await conn.query(
        `UPDATE rides SET seats_available = :newSeats WHERE id = :rideId`,
        { newSeats, rideId: booking.ride_id }
      );

      const [updated] = await conn.query(`SELECT * FROM bookings WHERE id = :id`, { id: bookingId });
      return updated[0];
    });
  },

  /** FZ-10: rezervacije korisnika (kao putnik), s detaljima vožnje. */
  async listByPassenger(passengerId) {
    const [rows] = await pool.query(
      `SELECT b.*, r.origin, r.destination, r.departure_time, r.price, r.status AS ride_status,
              u.first_name AS driver_first_name, u.last_name AS driver_last_name
       FROM bookings b
       JOIN rides r ON r.id = b.ride_id
       JOIN users u ON u.id = r.driver_id
       WHERE b.passenger_id = :passengerId
       ORDER BY r.departure_time DESC`,
      { passengerId }
    );
    return rows;
  },
};

module.exports = bookingModel;
