'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

/**
 * Konfiguracija Express aplikacije (aplikacijski poslužitelj / REST API sloj).
 * Slijedi MVC obrazac: rute -> kontroleri -> modeli (vidi dokumentaciju 6.2).
 */
const app = express();

// CORS – dopušta pristup React frontendu.
// U developmentu/testu odražava izvor zahtjeva (frontend se često otvara kao
// datoteka ili s drugog porta). U produkciji koristi CLIENT_ORIGIN, koji može
// biti jedan izvor, lista odvojena zarezom, ili "*" (svi izvori — npr. za demo).
function resolveCorsOrigin() {
  if (!env.isProd) return true;
  const o = (env.clientOrigin || '').trim();
  if (!o || o === '*') return true;
  const list = o.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : list;
}
app.use(cors({ origin: resolveCorsOrigin() }));

// Parsiranje JSON tijela zahtjeva
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logiranje HTTP zahtjeva (osim u testu)
if (!env.isTest) {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'unidrive-backend', status: 'ok' });
});

// API rute
app.use('/api', apiRoutes);

// 404 + centralni error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
