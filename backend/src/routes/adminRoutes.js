'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// FZ-13 / FZ-14: sve admin rute zahtijevaju ulogu 'admin'
router.use(authenticate, authorize('admin'));

router.get('/users', adminController.listUsers);
router.patch(
  '/users/:id/block',
  [param('id').isInt(), body('blocked').isBoolean()],
  validate,
  adminController.setBlocked
);
router.delete('/users/:id', [param('id').isInt()], validate, adminController.removeUser);

router.get('/stats', adminController.stats);

module.exports = router;
