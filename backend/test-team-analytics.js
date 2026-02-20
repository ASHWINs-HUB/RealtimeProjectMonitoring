import pool from './src/config/database.js';

pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'team_leader\' AND is_active = true')
  .then(result => {
    console.log('Active team leaders:', result.rows[0].count);
    
    return pool.query('SELECT COUNT(*) as count FROM users WHERE role IN (\'developer\', \'team_leader\') AND is_active = true');
  })
  .then(result => {
    console.log('Total team members (devs + team leaders):', result.rows[0].count);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
