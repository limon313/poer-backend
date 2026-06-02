const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://poer_db_user:7rcZVTdlclrCcMhsygkcFo9ECgcqUuAr@dpg-d8c0f34ua318fk3j5f50-a/poer_db',
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
