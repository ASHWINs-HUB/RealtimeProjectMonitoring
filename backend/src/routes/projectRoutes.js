import { Router } from 'express';
import { 
  createProject, 
  getAllProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  createTask, 
  getProjectTasks, 
  getProjectStats 
} from '../controllers/projectController.js';
import { validateWebhookAuth } from '../middleware/auth.js';
import { validateCreateProject } from '../middleware/validation.js';

const router = Router();

// POST /create-project - Main webhook endpoint
router.post('/create-project', validateWebhookAuth, validateCreateProject, createProject);

// GET /projects - Get all projects
router.get('/projects', getAllProjects);

// GET /projects/stats - Get project statistics
router.get('/projects/stats', getProjectStats);

// GET /projects/:id - Get project by ID
router.get('/projects/:id', getProjectById);

// PUT /projects/:id - Update project
router.put('/projects/:id', updateProject);

// DELETE /projects/:id - Delete project
router.delete('/projects/:id', deleteProject);

// POST /projects/:projectId/tasks - Create task for project
router.post('/projects/:projectId/tasks', createTask);

// GET /projects/:projectId/tasks - Get tasks for project
router.get('/projects/:projectId/tasks', getProjectTasks);

export default router;
