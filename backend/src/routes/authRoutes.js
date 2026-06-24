'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// FZ-1: prijava putem AAI@EduHr (mock/JIT u prototipu)
router.post(
  '/aai/login',
  [
    body('aai_uid').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Neispravan email'),
    body('first_name').optional().isString().trim(),
    body('last_name').optional().isString().trim(),
  ],
  validate,
  authController.login
);

router.get('/me', authenticate, authController.me);

module.exports = router;
