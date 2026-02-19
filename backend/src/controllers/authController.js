import { authService } from '../application/services/AuthService.js';
import logger from '../utils/logger.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { user, token } = await authService.register(req.body);
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user
        });
    } catch (error) {
        if (error.message.includes('exists')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        if (error.message.includes('Invalid')) {
            return res.status(401).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user.id);
        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/users
export const getUsers = async (req, res, next) => {
    try {
        const users = await authService.listUsers(req.query);
        res.json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
};

