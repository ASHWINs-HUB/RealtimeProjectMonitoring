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
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            refreshToken,
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

// PUT /api/auth/update-role
export const updateRole = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        const user = await authService.updateRole(userId, role);
        res.json({
            success: true,
            message: 'User role updated successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};
// POST /api/auth/verify-admin
export const verifyAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const isAdmin = await authService.verifyAdminCredentials(email, password);
        res.json({
            success: true,
            isValid: isAdmin
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

// POST /api/auth/users
export const adminCreateUser = async (req, res, next) => {
    try {
        const { user } = await authService.register({
            ...req.body,
            adminEmail: req.user.email,
            adminPassword: 'BYPASS_CHECK' // The service will handle the authorization
        });
        res.status(201).json({
            success: true,
            message: 'User created successfully by admin',
            user
        });
    } catch (error) {
        next(error);
    }
};
