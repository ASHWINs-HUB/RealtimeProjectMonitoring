const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const res = await pool.query(
      `SELECT column_name, data_type, character_maximum_length
       FROM information_schema.columns
       WHERE table_name = 'projects' ORDER BY ordinal_position`);

    console.log('projects table columns:');
    res.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}${r.character_maximum_length ? `(${r.character_maximum_length})` : ''}`));
  } catch (err) {
    console.error('Error querying columns:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();