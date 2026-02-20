import { Router } from 'express';
import { handleJiraWebhook } from '../controllers/webhookController.js';
import { verifyJiraSignature } from '../middleware/webhookValidator.js';

const router = Router();

/**
 * Public Webhook Endpoints
 * These are called by Jira/GitHub directly
 */

// POST /api/webhooks/jira?token=YOUR_SECRET_TOKEN
router.post('/jira', verifyJiraSignature, handleJiraWebhook);

export default router;
