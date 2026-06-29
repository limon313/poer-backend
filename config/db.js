const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://poer_db_user:7rcZVTdlclrCcMpTWPUMLc9ECgcqUuAr@dpg-d8c0f34ua31s739j5f50-a.oregon-postgres.render.com/poer_db',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('Beklenmeyen pool hatasi:', err.message);
});

module.exports = pool;
