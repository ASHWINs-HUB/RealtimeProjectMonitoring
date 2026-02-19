import pool from '../../../config/database.js';

export class UserRepository {
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        return result.rows[0];
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT id, name, email, role, department, avatar_url, created_at, last_login, is_active FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async create(userData) {
        const { name, email, password, role, department } = userData;
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department, created_at`,
            [name, email, password, role, department || null]
        );
        return result.rows[0];
    }

    async updateLastLogin(userId) {
        return pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    }

    async getAll(filters = {}) {
        const { role } = filters;
        let query = 'SELECT id, name, email, role, department, is_active, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query(query, params);
        return result.rows;
    }
}

export const userRepository = new UserRepository();
