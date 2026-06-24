'use strict';

const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * Podatkovni sloj – MySQL connection pool.
 *
 * Koristi se `mysql2/promise` kako bi se omogućila asinkrona (async/await)
 * komunikacija s bazom te efikasna obrada I/O zahtjeva (vidi dokumentaciju,
 * pogl. 7.4). Pool ponovno koristi otvorene konekcije umjesto otvaranja nove
 * veze za svaki zahtjev.
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl, // TLS za cloud baze (npr. Aiven); undefined za lokalni MySQL
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4', // podrška za hrvatske dijakritičke znakove
  timezone: 'Z',
  decimalNumbers: true,
  namedPlaceholders: true,
});

/**
 * Pomoćna funkcija za izvođenje upita unutar transakcije.
 * Koristi se npr. kod rezervacija (FZ-5) gdje je potrebno atomarno
 * provjeriti slobodna mjesta i smanjiti ih (sprječavanje race conditiona).
 *
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} work
 */
async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Provjera dostupnosti baze pri pokretanju poslužitelja.
 */
async function assertConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction, assertConnection };
