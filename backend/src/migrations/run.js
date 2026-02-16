import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
    try {
        // Create migrations tracking table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Get list of migration files
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(f => f.endsWith('.sql'))
            .sort();

        // Get already executed migrations
        const { rows: executed } = await pool.query(
            'SELECT filename FROM _migrations ORDER BY filename'
        );
        const executedSet = new Set(executed.map(r => r.filename));

        // Run pending migrations
        for (const file of migrationFiles) {
            if (executedSet.has(file)) {
                logger.info(`Migration already applied: ${file}`);
                continue;
            }

            logger.info(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query(
                    'INSERT INTO _migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                logger.info(`Migration completed: ${file}`);
            } catch (error) {
                await client.query('ROLLBACK');
                logger.error(`Migration failed: ${file}`, error);
                throw error;
            } finally {
                client.release();
            }
        }

        logger.info('All migrations completed successfully');
    } catch (error) {
        logger.error('Migration runner failed:', error);
        throw error;
    }
};

// Run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('dotenv').then(d => d.config());
    runMigrations()
        .then(() => {
            logger.info('Migrations complete');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Migration failed', error);
            process.exit(1);
        });
}
