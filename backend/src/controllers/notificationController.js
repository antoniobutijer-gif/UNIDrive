'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const notificationModel = require('../models/notificationModel');

const notificationController = {
  /** FZ-12: lista vlastitih notifikacija (opcionalno samo nepročitane). */
  list: asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === 'true';
    const data = await notificationModel.listForUser(req.user.id, { unreadOnly });
    const unread = await notificationModel.countUnread(req.user.id);
    res.json({ success: true, count: data.length, unread, data });
  }),

  markRead: asyncHandler(async (req, res) => {
    const ok = await notificationModel.markRead(req.params.id, req.user.id);
    if (!ok) throw ApiError.notFound('Notifikacija ne postoji');
    res.json({ success: true, message: 'Označeno kao pročitano' });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const updated = await notificationModel.markAllRead(req.user.id);
    res.json({ success: true, updated });
  }),
};

module.exports = notificationController;
