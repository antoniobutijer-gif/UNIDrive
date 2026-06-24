'use strict';

/**
 * Standardizirana aplikacijska greška s HTTP status kodom.
 * Centralni error handler je pretvara u JSON odgovor.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Neispravan zahtjev', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Niste autentificirani') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Nemate ovlasti za ovu radnju') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resurs nije pronađen') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Sukob sa trenutnim stanjem resursa') {
    return new ApiError(409, msg);
  }
}

module.exports = ApiError;
