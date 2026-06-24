'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.use(authenticate);

// FZ-11: ocjenjivanje korisnika
router.post(
  '/',
  [
    body('reviewee_id').isInt().withMessage('reviewee_id je obavezan'),
    body('ride_id').isInt().withMessage('ride_id je obavezan'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Ocjena mora biti 1–5'),
    body('comment').optional({ nullable: true }).isString().isLength({ max: 1000 }),
  ],
  validate,
  reviewController.create
);

// Ocjene koje je korisnik primio
router.get('/user/:id', [param('id').isInt()], validate, reviewController.listForUser);

module.exports = router;
