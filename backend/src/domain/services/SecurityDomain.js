import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import config from '../../config/index.js';

export class SecurityDomain {
    static async hashPassword(password) {
        const salt = await bcryptjs.genSalt(12);
        return bcryptjs.hash(password, salt);
    }

    static async comparePassword(password, hashedContext) {
        return bcryptjs.compare(password, hashedContext);
    }

    static generateToken(payload) {
        return jwt.sign(
            { id: payload.id, email: payload.email, role: payload.role, name: payload.name },
            config.jwt.secret,
            { expiresIn: '15m' } // Short-lived access token
        );
    }

    static generateRefreshToken(payload) {
        return jwt.sign(
            { id: payload.id },
            config.jwt.refreshSecret,
            { expiresIn: '7d' } // Long-lived refresh token
        );
    }

    static verifyToken(token, isRefresh = false) {
        return jwt.verify(token, isRefresh ? config.jwt.refreshSecret : config.jwt.secret);
    }

    /**
     * Enterprise Role Definitions & Hierarchy
     */
    static get ROLES() {
        return {
            ADMIN: 'admin',
            MANAGER: 'manager',
            TEAM_LEADER: 'team_leader',
            DEVELOPER: 'developer',
            QA: 'qa',
            DEVOPS: 'devops'
        };
    }

    /**
     * Permission check utility
     */
    static hasPermission(userRole, requiredRoles) {
        if (!userRole) return false;
        // Admins always have access
        if (userRole === this.ROLES.ADMIN) return true;
        return requiredRoles.includes(userRole);
    }
}
