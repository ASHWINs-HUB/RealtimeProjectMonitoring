import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    getDashboardAnalytics, getProjectRisk, getSprintDelay,
    getCompletionForecast, getDeveloperPerformance, getBurnoutScore,
    getJiraAnalytics, getGithubAnalytics, syncGithubCommits,
    triggerBatchCompute, getInsights, getManagerRecommendations,
    suggestTaskBreakdown, getRiskThresholds, getRoleRiskMetrics,
    triggerEscalationCheck
} from '../controllers/analyticsController.js';

const router = Router();
router.use(authenticateToken);

// Dashboard analytics (role-aware)
router.get('/dashboard', getDashboardAnalytics);

// Role-specific risk metrics & thresholds
router.get('/risk-thresholds', getRiskThresholds);
router.get('/role-risk', getRoleRiskMetrics);

// Project-level analytics
router.get('/project/:projectId/risk', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder'), getProjectRisk);
router.get('/project/:projectId/sprint-delay', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder'), getSprintDelay);
router.get('/project/:projectId/forecast', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder'), getCompletionForecast);
router.get('/project/:projectId/jira', authorizeRoles('hr', 'manager', 'admin'), getJiraAnalytics);
router.get('/project/:projectId/github', authorizeRoles('hr', 'manager', 'team_leader', 'admin'), getGithubAnalytics);
router.post('/project/:projectId/sync-commits', authorizeRoles('hr', 'manager', 'admin'), syncGithubCommits);

// Developer analytics
router.get('/developer/:userId/performance', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin'), getDeveloperPerformance);
router.get('/developer/:userId/burnout', authorizeRoles('hr', 'manager', 'team_leader', 'admin'), getBurnoutScore);
router.get('/my-performance', authorizeRoles('developer', 'team_leader'), getDeveloperPerformance);

// Recommendations & Assistance
router.get('/recommend-managers', authorizeRoles('hr', 'manager', 'admin'), getManagerRecommendations);
router.get('/suggest-tasks', authorizeRoles('hr', 'manager', 'team_leader', 'admin'), suggestTaskBreakdown);

// Insights
router.get('/insights', getInsights);

// Admin/User: trigger batch sync and ML computation
router.post('/compute-all', authorizeRoles('hr', 'manager', 'team_leader', 'developer', 'admin'), triggerBatchCompute);

// Escalation
router.post('/escalation-check', authorizeRoles('admin', 'hr'), triggerEscalationCheck);

export default router;
