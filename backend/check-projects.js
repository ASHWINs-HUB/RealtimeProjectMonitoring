import pool from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const checkProjects = async () => {
    try {
        const res = await pool.query('SELECT name, project_key, status, progress FROM projects');
        console.log('--- PROJECTS IN DATABASE ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkProjects();
