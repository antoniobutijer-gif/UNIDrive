'use strict';

const app = require('./app');
const env = require('./config/env');
const { assertConnection } = require('./config/db');

async function start() {
  try {
    await assertConnection();
    // eslint-disable-next-line no-console
    console.log(`✔ Spojeno na MySQL bazu "${env.db.database}" (${env.db.host}:${env.db.port})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('✘ Nije moguće spojiti se na bazu podataka:', err.message);
    console.error('  Provjeri .env postavke te je li pokrenut MySQL i napravljena migracija (npm run db:seed).');
    process.exit(1);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚗 UNIDrive API sluša na http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();
