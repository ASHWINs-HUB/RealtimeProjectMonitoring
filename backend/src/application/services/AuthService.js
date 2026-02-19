import { userRepository } from '../../infrastructure/database/repositories/UserRepository.js';
import { SecurityDomain } from '../../domain/services/SecurityDomain.js';
import logger from '../../utils/logger.js';

export class AuthService {
    async register(userData) {
        try {
            const existingUser = await userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('An account with this email already exists.');
            }

            const hashedPassword = await SecurityDomain.hashPassword(userData.password);

            const user = await userRepository.create({
                ...userData,
                password: hashedPassword
            });

            const token = SecurityDomain.generateToken(user);

            logger.info(`Enterprise User registered: ${user.email} (role: ${user.role})`);

            return { user, token };
        } catch (error) {
            logger.error(`Registration failed: ${error.message}`);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const user = await userRepository.findByEmail(email);
            if (!user) throw new Error('Invalid email or password.');

            const isValid = await SecurityDomain.comparePassword(password, user.password);
            if (!isValid) throw new Error('Invalid email or password.');

            await userRepository.updateLastLogin(user.id);

            const accessToken = SecurityDomain.generateToken(user);
            const refreshToken = SecurityDomain.generateRefreshToken(user);

            // Save refresh token to DB (Enterprise requirement for revocation)
            await pool.query(
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
                [user.id, refreshToken]
            );

            logger.info(`Enterprise User logged in: ${user.email}`);

            return {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                accessToken,
                refreshToken
            };
        } catch (error) {
            logger.error(`Login failed: ${error.message}`);
            throw error;
        }
    }

    async refreshToken(oldRefreshToken) {
        try {
            const decoded = SecurityDomain.verifyToken(oldRefreshToken, true);

            // Verify token exists in DB and is NOT revoked
            const result = await pool.query(
                'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND revoked = false',
                [oldRefreshToken, decoded.id]
            );

            if (result.rows.length === 0) throw new Error('Invalid or revoked refresh token');

            const user = await userRepository.findById(decoded.id);
            const newAccessToken = SecurityDomain.generateToken(user);
            const newRefreshToken = SecurityDomain.generateRefreshToken(user);

            // Rotate Refresh Token
            await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [oldRefreshToken]);
            await pool.query(
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
                [user.id, newRefreshToken]
            );

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            logger.error(`Token rotation failed: ${error.message}`);
            throw new Error('Unauthorized');
        }
    }

    async logout(refreshToken) {
        await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]);
    }

    async getCurrentUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found.');
        }
        return user;
    }

    async listUsers(filters) {
        return userRepository.getAll(filters);
    }
}

export const authService = new AuthService();
