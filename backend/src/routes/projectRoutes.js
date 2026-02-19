import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateCreateProject, validateCreateTask, validateUpdateTaskStatus, validateCreateScope } from '../middleware/validation.js';
import {
  createProject, getProjects, getProjectById, updateProject,
  acceptProject, declineProject, getProjectStats, approveProject, rejectProject
} from '../controllers/projectController.js';
import {
  createScope, getScopes, createTask, getAssignedTasks,
  updateTaskStatus, getProjectTasks, getTeams, createTeam,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  createTaskBranch
} from '../controllers/taskController.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============ PROJECT ROUTES ============
router.post('/projects', authorizeRoles('hr', 'stakeholder', 'admin'), validateCreateProject, createProject);
router.get('/projects', getProjects);
router.get('/projects/stats', authorizeRoles('hr', 'admin'), getProjectStats);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', authorizeRoles('hr', 'manager', 'admin'), updateProject);

// Manager accept/decline
router.post('/projects/:id/accept', authorizeRoles('manager'), acceptProject);
router.post('/projects/:id/decline', authorizeRoles('manager'), declineProject);

// HR / Admin approve/reject proposals
router.post('/projects/:id/approve', authorizeRoles('hr', 'admin'), approveProject);
router.post('/projects/:id/reject', authorizeRoles('hr', 'admin'), rejectProject);

// ============ SCOPE ROUTES ============
router.post('/projects/:projectId/scopes', authorizeRoles('manager', 'admin'), validateCreateScope, createScope);
router.get('/projects/:projectId/scopes', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder'), getScopes);

// ============ TASK ROUTES ============
router.post('/projects/:projectId/tasks', authorizeRoles('team_leader', 'admin'), validateCreateTask, createTask);
router.get('/projects/:projectId/tasks', getProjectTasks);
router.get('/tasks/assigned', authorizeRoles('developer', 'team_leader', 'admin'), getAssignedTasks);
router.put('/tasks/:taskId/status', authorizeRoles('developer', 'team_leader', 'admin'), validateUpdateTaskStatus, updateTaskStatus);
router.post('/tasks/:taskId/create-branch', authorizeRoles('developer', 'team_leader', 'admin'), createTaskBranch);

// ============ TEAM ROUTES ============
router.get('/teams', getTeams);
router.post('/teams', authorizeRoles('team_leader', 'admin'), createTeam);

// ============ NOTIFICATION ROUTES ============
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
