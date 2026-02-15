import { Router } from 'express';
import { createProject } from '../controllers/projectController.js';
import { validateWebhookAuth } from '../middleware/auth.js';
import { validateCreateProject } from '../middleware/validation.js';

const router = Router();

// POST /create-project - Main webhook endpoint
router.post('/create-project', validateWebhookAuth, validateCreateProject, createProject);

export default router;
