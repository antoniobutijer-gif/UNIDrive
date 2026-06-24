'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const rideController = require('../controllers/rideController');

const router = express.Router();

const ALLOWED_PREFS = ['klima', 'glazba', 'bez_pusenja', 'tiha_voznja', 'prtljaga'];

// FZ-3 / FZ-4: pretraga i filtriranje (javno dostupno prijavljenima)
router.get(
  '/',
  authenticate,
  [
    query('origin').optional().isString().trim(),
    query('destination').optional().isString().trim(),
    query('date').optional().isISO8601().withMessage('Datum mora biti u ISO formatu (YYYY-MM-DD)'),
    query('preferences').optional().isString(),
  ],
  validate,
  rideController.search
);

router.get('/:id', authenticate, [param('id').isInt()], validate, rideController.getOne);

// FZ-9: prijavljeni putnici na vožnji
router.get('/:id/passengers', authenticate, [param('id').isInt()], validate, rideController.listPassengers);

// FZ-7: kreiranje vožnje
router.post(
  '/',
  authenticate,
  [
    body('origin').isString().trim().notEmpty().withMessage('Polazište je obavezno').isLength({ max: 100 }),
    body('destination').isString().trim().notEmpty().withMessage('Odredište je obavezno').isLength({ max: 100 }),
    body('departure_time').isISO8601().withMessage('Vrijeme polaska mora biti valjan datum/vrijeme'),
    body('seats_available').isInt({ min: 1, max: 8 }).withMessage('Broj mjesta mora biti 1–8'),
    body('price').isFloat({ min: 0 }).withMessage('Cijena mora biti nenegativan broj'),
    body('preferences').optional().isArray().withMessage('Preferencije moraju biti niz'),
    body('preferences.*').optional().isIn(ALLOWED_PREFS),
  ],
  validate,
  rideController.create
);

// FZ-8: uređivanje vožnje
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt(),
    body('origin').optional().isString().trim().isLength({ max: 100 }),
    body('destination').optional().isString().trim().isLength({ max: 100 }),
    body('departure_time').optional().isISO8601(),
    body('seats_available').optional().isInt({ min: 0, max: 8 }),
    body('price').optional().isFloat({ min: 0 }),
    body('preferences').optional().isArray(),
    body('status').optional().isIn(['active', 'completed', 'cancelled']),
  ],
  validate,
  rideController.update
);

// FZ-8: brisanje vožnje
router.delete('/:id', authenticate, [param('id').isInt()], validate, rideController.remove);

// FZ-5: rezervacija mjesta na vožnji
router.post(
  '/:id/bookings',
  authenticate,
  [
    param('id').isInt(),
    body('seats').optional().isInt({ min: 1, max: 8 }).withMessage('Broj mjesta mora biti 1–8'),
  ],
  validate,
  rideController.book
);

module.exports = router;
