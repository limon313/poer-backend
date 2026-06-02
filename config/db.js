const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URL;

console.log('DB URL:', connectionString ? 'VAR' : 'YOK');
console.log('ENV KEYS:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('PG') || k.includes('POSTGRES') || k.includes('DATABASE')));

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
