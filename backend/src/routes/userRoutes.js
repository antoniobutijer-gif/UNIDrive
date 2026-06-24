'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authenticate); // sve rute zahtijevaju prijavu

// FZ-2: vlastiti profil
router.get('/me', userController.getProfile);
router.put(
  '/me',
  [
    body('first_name').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('last_name').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
    body('avatar_url').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('ride_pref').optional().isIn(['passenger', 'driver', 'both']),
  ],
  validate,
  userController.updateProfile
);

// FZ-10: povijest vožnji
router.get('/me/history', userController.getHistory);

// Javni profil + ocjene
router.get('/:id', [param('id').isInt()], validate, userController.getPublicProfile);

module.exports = router;
