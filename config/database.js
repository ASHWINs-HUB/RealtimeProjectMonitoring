const knex = require('knex');
const logger = require('../utils/logger');

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_pulse_ai'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
});

async function connectDB() {
  try {
    await db.raw('SELECT 1');
    logger.info('PostgreSQL connected successfully');
    return db;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await db.raw('SELECT version()');
    logger.info('Database test connection successful:', result.rows[0].version);
    return true;
  } catch (error) {
    logger.error('Database test connection failed:', error);
    return false;
  }
}

module.exports = {
  db,
  connectDB,
  disconnectDB,
  testConnection
};
