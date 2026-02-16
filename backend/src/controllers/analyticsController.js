import { mlAnalytics } from '../services/mlAnalytics.js';
import { jiraService } from '../services/jiraService.js';
import { githubService } from '../services/githubService.js';
import { syncService } from '../services/syncService.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

// GET /api/analytics/dashboard
export const getDashboardAnalytics = async (req, res, next) => {
    try {
        const analytics = await mlAnalytics.getDashboardAnalytics(req.user.role, req.user.id);
        res.json({ success: true, analytics });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/project/:projectId/risk
export const getProjectRisk = async (req, res, next) => {
    try {
        const risk = await mlAnalytics.computeRiskScore(req.params.projectId);
        res.json({ success: true, risk });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/project/:projectId/sprint-delay
export const getSprintDelay = async (req, res, next) => {
    try {
        const prediction = await mlAnalytics.predictSprintDelay(req.params.projectId);
        res.json({ success: true, prediction });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/project/:projectId/forecast
export const getCompletionForecast = async (req, res, next) => {
    try {
        const forecast = await mlAnalytics.forecastCompletion(req.params.projectId);
        res.json({ success: true, forecast });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/developer/:userId/performance
export const getDeveloperPerformance = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;
        const performance = await mlAnalytics.computeDeveloperPerformance(userId);
        res.json({ success: true, performance });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/developer/:userId/burnout
export const getBurnoutScore = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;
        const burnout = await mlAnalytics.detectBurnout(userId);
        res.json({ success: true, burnout });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/project/:projectId/jira
export const getJiraAnalytics = async (req, res, next) => {
    try {
        const jiraMapping = await pool.query(
            'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
            [req.params.projectId]
        );

        if (jiraMapping.rows.length === 0) {
            return res.json({ success: true, analytics: null, message: 'No Jira mapping found' });
        }

        const analytics = await jiraService.getProjectAnalytics(jiraMapping.rows[0].jira_project_key);
        res.json({ success: true, analytics });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/project/:projectId/github
export const getGithubAnalytics = async (req, res, next) => {
    try {
        const githubMapping = await pool.query(
            'SELECT repo_full_name FROM github_mapping WHERE project_id = $1 LIMIT 1',
            [req.params.projectId]
        );

        if (githubMapping.rows.length === 0) {
            return res.json({ success: true, analytics: null, message: 'No GitHub mapping found' });
        }

        const [owner, repo] = githubMapping.rows[0].repo_full_name.split('/');
        const analytics = await githubService.getRepositoryAnalytics(owner, repo);
        res.json({ success: true, analytics });
    } catch (error) {
        next(error);
    }
};

// POST /api/analytics/project/:projectId/sync-commits
export const syncGithubCommits = async (req, res, next) => {
    try {
        const result = await githubService.syncCommitsToDb(req.params.projectId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// POST /api/analytics/compute-all - Trigger batch computation
export const triggerBatchCompute = async (req, res, next) => {
    try {
        // Run sync and then compute async
        (async () => {
            try {
                await syncService.syncAll();
                await mlAnalytics.computeAllMetrics();
            } catch (e) {
                logger.error('Batch compute failed:', e);
            }
        })();

        res.json({ success: true, message: 'External synchronization and batch computation triggered' });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/insights
export const getInsights = async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        const insights = [];

        // Get recent high-risk projects
        const highRisk = await pool.query(`
      SELECT p.name, am.metric_value as risk_score
      FROM analytics_metrics am
      JOIN projects p ON am.project_id = p.id
      WHERE am.metric_type = 'risk_score' 
        AND am.metric_value > 60
        AND am.computed_at > NOW() - INTERVAL '24 hours'
      ORDER BY am.metric_value DESC LIMIT 5
    `);

        if (highRisk.rows.length > 0) {
            insights.push({
                type: 'risk_alert',
                severity: 'high',
                title: `${highRisk.rows.length} project(s) at high risk`,
                details: highRisk.rows,
                action: 'Review resource allocation and deadlines'
            });
        }

        // Burnout alerts (for managers/HR)
        if (role === 'hr' || role === 'manager') {
            const burnoutAlerts = await pool.query(`
        SELECT u.name, am.metric_value as burnout_score
        FROM analytics_metrics am
        JOIN users u ON am.user_id = u.id
        WHERE am.metric_type = 'burnout_score'
          AND am.metric_value > 50
          AND am.computed_at > NOW() - INTERVAL '24 hours'
        ORDER BY am.metric_value DESC LIMIT 5
      `);

            if (burnoutAlerts.rows.length > 0) {
                insights.push({
                    type: 'burnout_warning',
                    severity: 'medium',
                    title: `${burnoutAlerts.rows.length} team member(s) showing burnout signals`,
                    details: burnoutAlerts.rows,
                    action: 'Schedule check-ins and review workload distribution'
                });
            }
        }

        // Overdue tasks
        const overdueTasks = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE due_date < CURRENT_DATE AND status NOT IN ('done', 'blocked')
    `);

        if (parseInt(overdueTasks.rows[0].count) > 0) {
            insights.push({
                type: 'overdue_tasks',
                severity: 'medium',
                title: `${overdueTasks.rows[0].count} overdue task(s)`,
                action: 'Review and reprioritize overdue tasks'
            });
        }

        res.json({ success: true, insights });
    } catch (error) {
        next(error);
    }
};
