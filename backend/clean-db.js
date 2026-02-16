import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function clean() {
    const client = await pool.connect();
    try {
        console.log('Cleaning database...');
        // Drop tables in reverse order of dependencies
        const tables = [
            'activity_log', 'notifications', 'analytics_metrics', 'github_commits',
            'github_mapping', 'jira_mapping', 'tasks', 'team_members', 'teams',
            'scopes', 'project_managers', 'sprints', 'projects', 'users', '_migrations'
        ];

        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }
        console.log('✅ Database cleaned successfully!');
    } catch (error) {
        console.error('❌ Clean failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

clean();
