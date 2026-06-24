'use strict';

const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Middleware za rute koje ne postoje (404).
 */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Ruta nije pronađena: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralni error handler – pretvara greške u jedinstveni JSON format.
 * Mapira poznate MySQL greške (npr. duplikat, FK) u prikladne HTTP kodove.
 */
function errorHandler(err, _req, res, _next) {
  let error = err;

  // Prevedi tipične MySQL greške u ApiError
  if (err && err.code === 'ER_DUP_ENTRY') {
    error = ApiError.conflict('Zapis s tom vrijednošću već postoji');
  } else if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = ApiError.badRequest('Referencirani resurs ne postoji');
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || 500, err.message || 'Interna greška poslužitelja');
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[UNIDrive] Greška:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message,
      details: error.details,
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}

module.exports = { notFound, errorHandler };
