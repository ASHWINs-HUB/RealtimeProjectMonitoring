import pool from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const tables = [
    'notifications',
    'activity_log',
    'analytics_metrics',
    'github_commits',
    'github_mapping',
    'jira_mapping',
    'tasks',
    'team_members',
    'teams',
    'scopes',
    'project_managers',
    'projects',
    'users'
];

const reset = async () => {
    console.log('Resetting database...');
    for (const t of tables) {
        try {
            await pool.query(`TRUNCATE ${t} CASCADE`);
            console.log(`Truncated ${t}`);
        } catch (err) {
            console.warn(`Could not truncate ${t}: ${err.message}`);
        }
    }
    console.log('Database reset complete.');
    process.exit(0);
};

reset().catch(e => {
    console.error(e);
    process.exit(1);
});
