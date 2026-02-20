import pool from './src/config/database.js';

pool.query('SELECT COUNT(*) as total FROM analytics_metrics WHERE computed_at > NOW() - INTERVAL \'1 hour\'')
  .then(result => {
    console.log('Analytics metrics computed in last hour:', result.rows[0].total);
    
    return pool.query('SELECT metric_type, COUNT(*) as count FROM analytics_metrics GROUP BY metric_type');
  })
  .then(result => {
    console.log('Metrics by type:');
    console.table(result.rows);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
