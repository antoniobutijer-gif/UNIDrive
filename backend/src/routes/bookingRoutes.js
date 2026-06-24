'use strict';

const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authenticate);

// FZ-10: vlastite rezervacije
router.get('/me', bookingController.listMine);

// FZ-6: otkazivanje rezervacije
router.patch('/:id/cancel', [param('id').isInt()], validate, bookingController.cancel);

module.exports = router;
