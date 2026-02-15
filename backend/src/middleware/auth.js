import logger from '../utils/logger.js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error('WEBHOOK_SECRET environment variable is required');
}

export const validateWebhookAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Authorization header missing');
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid authorization format');
      return res.status(401).json({
        success: false,
        message: 'Authorization format should be: Bearer <token>'
      });
    }

    const token = parts[1];

    if (token !== WEBHOOK_SECRET) {
      logger.warn('Invalid webhook secret');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook secret'
      });
    }

    logger.info('Webhook authentication successful');
    next();
  } catch (error) {
    logger.error('Error in webhook authentication:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
