'use strict';

/**
 * Jednostavna migracijska skripta.
 *   node src/db/migrate.js          -> kreira shemu (schema.sql)
 *   node src/db/migrate.js --seed   -> kreira shemu i ubacuje demo podatke
 *
 * Skripta se spaja bez odabrane baze (multipleStatements) jer schema.sql
 * sam kreira i odabire bazu.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

async function run() {
  const withSeed = process.argv.includes('--seed');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl, // TLS za cloud baze (Aiven)
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    // Pokušaj kreirati bazu (lokalno); na Aivenu se koristi postojeća (defaultdb).
    const dbName = env.db.database;
    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch (e) {
      console.log(`(Preskačem kreiranje baze "${dbName}" – koristim postojeću: ${e.code || e.message})`);
    }
    await connection.query(`USE \`${dbName}\``);

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log(`▶ Primjenjujem schema.sql u bazu "${dbName}" ...`);
    await connection.query(schemaSql);
    console.log('✔ Shema kreirana.');

    if (withSeed) {
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      console.log('▶ Ubacujem demo podatke (seed.sql) ...');
      await connection.query(seedSql);
      console.log('✔ Demo podaci ubačeni.');
    }
  } finally {
    await connection.end();
  }
}

run()
  .then(() => {
    console.log('Migracija završena.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migracija nije uspjela:', err.message);
    process.exit(1);
  });
