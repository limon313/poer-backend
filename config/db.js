const { Pool } = require('pg');

console.log('DB URL:', process.env.DATABASE_URL ? 'VAR' : 'YOK');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
