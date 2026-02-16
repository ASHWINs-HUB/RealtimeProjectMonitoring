import pool from './src/config/database.js';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const checkUsers = async () => {
    try {
        const res = await pool.query('SELECT name, email, role, is_active FROM users');
        console.log('--- USERS IN DATABASE ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkUsers();
