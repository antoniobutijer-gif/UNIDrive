'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware koji sakuplja rezultate express-validator provjera i,
 * ako postoje greške, vraća 400 s detaljima (vidi FZ-1, FZ-7: validacija unosa).
 */
function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(ApiError.badRequest('Validacija nije uspjela', details));
  }
  next();
}

module.exports = validate;
