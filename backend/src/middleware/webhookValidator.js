import crypto from 'crypto';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Enterprise Webhook Signature Verification
 */
export const verifyGitHubSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const secret = config.github.webhookSecret;

    if (!signature) {
        logger.warn('Missing GitHub signature header');
        return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        logger.warn('GitHub signature mismatch detected');
        return res.status(401).json({ success: false, message: 'Invalid signature signature' });
    }

    next();
};

export const verifyJiraSignature = (req, res, next) => {
    // Jira webhooks typically use a shared secret in the query param or basic auth
    // For production, we validate the shared secret configured in Jira
    const webhookToken = req.query.token;

    if (!webhookToken || webhookToken !== config.jira.webhookToken) {
        logger.warn('Jira webhook token mismatch');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    next();
};
