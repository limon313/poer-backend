const { Pool } = require('pg');

const pool = new Pool({
  connectionString: postgresql://poer_db_user:7rcZVTdlclrCcMpTWPUMLc9ECgcqUuAr@dpg-d8c0f34ua31s739j5f50-a/poer_db
});

module.exports = pool;
