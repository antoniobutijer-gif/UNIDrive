'use strict';

const { pool } = require('../config/db');

/** Polja koja se sigurno smiju vraćati klijentu. */
const PUBLIC_FIELDS = `
  id, aai_uid, first_name, last_name, phone, role,
  avatar_url, ride_pref, is_blocked, created_at
`;

const userModel = {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = :id`,
      { id }
    );
    return rows[0] || null;
  },

  async findByAaiUid(aaiUid) {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE aai_uid = :aaiUid`,
      { aaiUid }
    );
    return rows[0] || null;
  },

  async create({ aai_uid, first_name, last_name, phone = null, role = 'student', ride_pref = 'both' }) {
    const [result] = await pool.query(
      `INSERT INTO users (aai_uid, first_name, last_name, phone, role, ride_pref)
       VALUES (:aai_uid, :first_name, :last_name, :phone, :role, :ride_pref)`,
      { aai_uid, first_name, last_name, phone, role, ride_pref }
    );
    return this.findById(result.insertId);
  },

  /** FZ-2: ažuriranje profila (samo dopuštena polja). */
  async update(id, fields) {
    const allowed = ['first_name', 'last_name', 'phone', 'avatar_url', 'ride_pref'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map((k) => `${k} = :${k}`).join(', ');
    await pool.query(`UPDATE users SET ${setClause} WHERE id = :id`, { ...fields, id });
    return this.findById(id);
  },

  /** FZ-13: administracija – lista svih korisnika s prosječnom ocjenom. */
  async list({ limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_FIELDS},
              (SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.reviewee_id = users.id) AS avg_rating
       FROM users
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
      { limit: Number(limit), offset: Number(offset) }
    );
    return rows;
  },

  async setBlocked(id, blocked) {
    await pool.query(`UPDATE users SET is_blocked = :blocked WHERE id = :id`, {
      id,
      blocked: blocked ? 1 : 0,
    });
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.query(`DELETE FROM users WHERE id = :id`, { id });
    return result.affectedRows > 0;
  },

  /** FZ-11: prosječna ocjena i broj ocjena za korisnika. */
  async getRatingSummary(id) {
    const [rows] = await pool.query(
      `SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS reviews_count
       FROM reviews WHERE reviewee_id = :id`,
      { id }
    );
    return { avg_rating: rows[0].avg_rating, reviews_count: rows[0].reviews_count };
  },
};

module.exports = userModel;
