import pkg from 'pg';
import config from './index.js';
import logger from '../utils/logger.js';

const { Pool } = pkg;

const pool = new Pool(config.db);

pool.on('connect', () => {
  logger.info('PostgreSQL client connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL error on idle client', err);
  process.exit(-1);
});

// Test connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    logger.info(`PostgreSQL connected at ${res.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error.message);
    throw error;
  }
};

export default pool;
