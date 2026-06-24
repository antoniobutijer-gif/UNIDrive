'use strict';

const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticate);

// FZ-12: notifikacije
router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', [param('id').isInt()], validate, notificationController.markRead);

module.exports = router;
