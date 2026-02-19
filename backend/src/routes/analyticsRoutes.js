import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    getDashboardAnalytics, getProjectRisk, getSprintDelay,
    getCompletionForecast, getDeveloperPerformance, getBurnoutScore,
    getJiraAnalytics, getGithubAnalytics, syncGithubCommits,
    triggerBatchCompute, getInsights, getManagerRecommendations,
    suggestTaskBreakdown
} from '../controllers/analyticsController.js';

const router = Router();
router.use(authenticateToken);

// Dashboard analytics (role-aware)
router.get('/dashboard', getDashboardAnalytics);

// Project-level analytics
router.get('/project/:projectId/risk', authorizeRoles('hr', 'manager', 'team_leader', 'developer'), getProjectRisk);
router.get('/project/:projectId/sprint-delay', authorizeRoles('hr', 'manager', 'team_leader', 'developer'), getSprintDelay);
router.get('/project/:projectId/forecast', authorizeRoles('hr', 'manager', 'team_leader', 'developer'), getCompletionForecast);
router.get('/project/:projectId/jira', authorizeRoles('hr', 'manager'), getJiraAnalytics);
router.get('/project/:projectId/github', authorizeRoles('hr', 'manager', 'team_leader'), getGithubAnalytics);
router.post('/project/:projectId/sync-commits', authorizeRoles('hr', 'manager'), syncGithubCommits);

// Developer analytics
router.get('/developer/:userId/performance', authorizeRoles('hr', 'manager', 'team_leader', 'developer'), getDeveloperPerformance);
router.get('/developer/:userId/burnout', authorizeRoles('hr', 'manager', 'team_leader'), getBurnoutScore);
router.get('/my-performance', authorizeRoles('developer'), getDeveloperPerformance);

// Recommendations & Assistance
router.get('/recommend-managers', authorizeRoles('hr', 'manager'), getManagerRecommendations);
router.get('/suggest-tasks', authorizeRoles('hr', 'manager', 'team_leader'), suggestTaskBreakdown);

// Insights
router.get('/insights', getInsights);

// Admin/User: trigger batch sync and ML computation
router.post('/compute-all', authorizeRoles('hr', 'manager', 'team_leader', 'developer'), triggerBatchCompute);

export default router;
