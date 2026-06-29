const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://poer_db_iht0_user:dY9EvQshZ1ryGziSnF32T1udXGegIRfW@dpg-d91furgk1i2s73asa4kg-a.oregon-postgres.render.com/poer_db_iht0',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
pool.on('error', (err) => console.error('Pool hatasi:', err.message));
module.exports = pool;
