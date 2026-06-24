'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Učitaj .env iz korijena backend mape (jednom, na startu aplikacije)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Gradi SSL konfiguraciju za MySQL spoj.
 * Aiven (i drugi cloud MySQL servisi) zahtijevaju TLS. Postavi DB_SSL=true i,
 * po želji, DB_SSL_CA na putanju do CA certifikata (npr. ca.pem u backend mapi).
 */
function buildDbSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;
  // Cloud deploy (Render): CA certifikat se predaje kao tekst kroz env varijablu,
  // jer ca.pem datoteka nije u Git repozitoriju.
  if (process.env.DB_CA_CERT) {
    return { ca: process.env.DB_CA_CERT, rejectUnauthorized: true };
  }
  const caPath = process.env.DB_SSL_CA;
  if (caPath) {
    const resolved = path.isAbsolute(caPath) ? caPath : path.resolve(__dirname, '../../', caPath);
    try {
      return { ca: fs.readFileSync(resolved), rejectUnauthorized: true };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Upozorenje: ne mogu pročitati CA certifikat (${resolved}): ${e.message}`);
      return { rejectUnauthorized: false };
    }
  }
  // SSL uključen bez CA certa – šifrirano, ali bez provjere certifikata
  return { rejectUnauthorized: false };
}

/**
 * Pomoćna funkcija – dohvaća obaveznu varijablu okoline ili baca grešku
 * (osim u testnom okruženju gdje se koriste podrazumijevane vrijednosti).
 */
function required(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    if (process.env.NODE_ENV === 'test') return '';
    throw new Error(`Nedostaje obavezna varijabla okoline: ${key}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'unidrive',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    ssl: buildDbSsl(),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_promijeni_me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  aai: {
    apiKey: process.env.AAI_API_KEY || '',
    entityId: process.env.AAI_ENTITY_ID || '',
    ssoUrl: process.env.AAI_SSO_URL || '',
    allowDevLogin: process.env.AAI_ALLOW_DEV_LOGIN !== 'false',
  },

  rating: {
    min: parseInt(process.env.MIN_RATING || '1', 10),
    max: parseInt(process.env.MAX_RATING || '5', 10),
  },
};

module.exports = env;
