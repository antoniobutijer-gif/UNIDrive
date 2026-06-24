'use strict';

const { pool } = require('../config/db');

const notificationModel = {
  /** FZ-12: kreiranje notifikacije. Prima opcionalnu konekciju (za transakcije). */
  async create({ user_id, message }, conn = pool) {
    const [result] = await conn.query(
      `INSERT INTO notifications (user_id, message) VALUES (:user_id, :message)`,
      { user_id, message }
    );
    return result.insertId;
  },

  async listForUser(userId, { unreadOnly = false } = {}) {
    const where = unreadOnly ? 'user_id = :userId AND is_read = 0' : 'user_id = :userId';
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC`,
      { userId }
    );
    return rows;
  },

  async countUnread(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = :userId AND is_read = 0`,
      { userId }
    );
    return rows[0].unread;
  },

  async markRead(id, userId) {
    const [result] = await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :userId`,
      { id, userId }
    );
    return result.affectedRows > 0;
  },

  async markAllRead(userId) {
    const [result] = await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = :userId AND is_read = 0`,
      { userId }
    );
    return result.affectedRows;
  },
};

module.exports = notificationModel;
