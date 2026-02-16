import bcryptjs from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, department } = req.body;

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1', [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(12);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department, created_at`,
            [name, email, hashedPassword, role, department || null]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        logger.info(`User registered: ${user.email} (role: ${user.role})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true', [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcryptjs.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = generateToken(user);

        logger.info(`User logged in: ${user.email}`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, department, avatar_url, created_at, last_login FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/users - Get users (filterable by role)
export const getUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email, role, department, is_active, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query(query, params);

        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        next(error);
    }
};
