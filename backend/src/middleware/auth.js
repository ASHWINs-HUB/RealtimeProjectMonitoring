import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// JWT Authentication Middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid token.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    logger.warn('Invalid token attempt:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token.'
    });
  }
};

// Role-Based Access Control Middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} (role: ${req.user.role}) to resource requiring roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions for this resource.'
      });
    }

    next();
  };
};

// Webhook authentication (for GitHub/Jira webhooks)
export const validateWebhookAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is required'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Authorization format should be: Bearer <token>'
    });
  }

  if (parts[1] !== config.webhook.secret) {
    logger.warn('Invalid webhook secret attempt');
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook secret'
    });
  }

  next();
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};
