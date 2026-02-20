import pool from './src/config/database.js';

pool.query('SELECT * FROM analytics_metrics WHERE metric_type = \'risk_score\' ORDER BY computed_at DESC LIMIT 10')
  .then(result => {
    console.log('Recent Risk Scores:');
    console.table(result.rows);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
