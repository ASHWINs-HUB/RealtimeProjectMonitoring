import { mlAnalytics } from '../services/mlAnalytics.js';
import { jiraService } from '../services/jiraService.js';
import { githubService } from '../services/githubService.js';
import { syncService } from '../services/syncService.js';
import { escalationService, ROLE_THRESHOLDS } from '../services/escalationService.js';
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

// GET /api/analytics/recommend-managers
export const getManagerRecommendations = async (req, res, next) => {
    try {
        const priority = req.query.priority || 'medium';
        const recommendations = await mlAnalytics.recommendManagers(priority);
        res.json({ success: true, recommendations });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/suggest-tasks
export const suggestTaskBreakdown = async (req, res, next) => {
    try {
        const { title, description } = req.query;
        const suggestions = await mlAnalytics.suggestTaskBreakdown(title, description);
        res.json({ success: true, suggestions });
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

// GET /api/analytics/risk-thresholds
export const getRiskThresholds = async (req, res) => {
    const role = req.user.role;
    const thresholds = ROLE_THRESHOLDS[role] || ROLE_THRESHOLDS.developer;
    res.json({
        success: true,
        role,
        thresholds,
        all_thresholds: ROLE_THRESHOLDS,
    });
};

// GET /api/analytics/role-risk - Role-specific risk dashboard metrics
export const getRoleRiskMetrics = async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        const thresholds = ROLE_THRESHOLDS[role] || ROLE_THRESHOLDS.developer;
        const result = { role, thresholds, alerts: [] };

        if (role === 'developer') {
            // Personal metrics only
            const performance = await mlAnalytics.computeDeveloperPerformance(userId);
            const burnout = await mlAnalytics.detectBurnout(userId);

            // Personal commit frequency
            const commits = await pool.query(`
                SELECT COUNT(*) as total,
                    COUNT(CASE WHEN committed_at > NOW() - INTERVAL '7 days' THEN 1 END) as weekly,
                    COUNT(CASE WHEN committed_at > NOW() - INTERVAL '30 days' THEN 1 END) as monthly
                FROM github_commits
                WHERE author_email = (SELECT email FROM users WHERE id = $1)
            `, [userId]);

            // Personal task delay metrics
            const tasks = await pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
                    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue,
                    AVG(CASE WHEN status = 'done' AND completed_at IS NOT NULL AND due_date IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (completed_at - due_date)) / 86400.0 ELSE 0 END) as avg_delay_days
                FROM tasks WHERE assigned_to = $1
            `, [userId]);

            const personalRisk = 100 - performance.score; // Inverse of performance
            const riskLevel = escalationService.classifyRisk(personalRisk, role);

            result.personal_risk_score = personalRisk;
            result.risk_level = riskLevel;
            result.performance = performance;
            result.burnout = burnout;
            result.commit_stats = commits.rows[0];
            result.task_stats = tasks.rows[0];

            if (riskLevel === 'danger') {
                result.alerts.push({
                    type: 'danger',
                    message: `Critical Risk Detected – Personal risk score is ${personalRisk}%. Immediate attention required.`,
                    icon: '🔴',
                });
            } else if (riskLevel === 'warning') {
                result.alerts.push({
                    type: 'warning',
                    message: `Warning: Your risk score (${personalRisk}%) has crossed the threshold.`,
                    icon: '🟡',
                });
            }
        } else if (role === 'team_leader') {
            // Team metrics
            const teamMembers = await pool.query(`
                SELECT u.id, u.name FROM users u
                JOIN team_members tm ON tm.user_id = u.id
                JOIN teams t ON t.id = tm.team_id
                WHERE t.team_leader_id = $1 AND u.is_active = true
            `, [userId]);

            let teamRiskTotal = 0;
            const memberMetrics = [];
            for (const m of teamMembers.rows) {
                try {
                    const perf = await mlAnalytics.computeDeveloperPerformance(m.id);
                    const risk = 100 - perf.score;
                    teamRiskTotal += risk;
                    memberMetrics.push({ id: m.id, name: m.name, risk_score: risk, performance: perf.score });
                } catch { /* skip */ }
            }

            const teamRisk = memberMetrics.length > 0
                ? Math.round(teamRiskTotal / memberMetrics.length)
                : 0;
            const riskLevel = escalationService.classifyRisk(teamRisk, role);

            // Sprint delay for team projects
            const sprintData = await pool.query(`
                SELECT
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as delayed,
                    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked
                FROM tasks t
                JOIN scopes s ON s.id = t.scope_id
                WHERE s.team_leader_id = $1
            `, [userId]);

            const sprintStats = sprintData.rows[0];
            const totalTasks = parseInt(sprintStats.total_tasks) || 1;
            const sprintDelayPct = Math.round((parseInt(sprintStats.delayed) / totalTasks) * 100);

            result.team_risk_score = teamRisk;
            result.risk_level = riskLevel;
            result.sprint_delay_pct = sprintDelayPct;
            result.blocked_issues = parseInt(sprintStats.blocked);
            result.team_members = memberMetrics;

            if (riskLevel === 'danger') {
                result.alerts.push({
                    type: 'danger',
                    message: `Critical Risk Detected – Team risk is ${teamRisk}%. Immediate review required.`,
                    icon: '🔴',
                });
            } else if (riskLevel === 'warning') {
                result.alerts.push({
                    type: 'warning',
                    message: `Warning: Team risk score (${teamRisk}%) has crossed threshold.`,
                    icon: '🟡',
                });
            }
        } else if (role === 'manager') {
            // Cross-team performance risk
            const projects = await pool.query(`
                SELECT p.id, p.name, p.status, p.progress, p.priority
                FROM projects p
                JOIN project_managers pm ON pm.project_id = p.id
                WHERE pm.manager_id = $1 AND p.status NOT IN ('completed', 'cancelled')
            `, [userId]);

            const projectRisks = [];
            let totalRisk = 0;
            for (const p of projects.rows) {
                try {
                    const risk = await mlAnalytics.computeRiskScore(p.id);
                    totalRisk += risk.score;
                    projectRisks.push({
                        id: p.id, name: p.name, status: p.status,
                        risk_score: risk.score, risk_level: risk.level,
                    });
                } catch { projectRisks.push({ id: p.id, name: p.name, risk_score: 0, risk_level: 'low' }); }
            }

            const managerRisk = projectRisks.length > 0
                ? Math.round(totalRisk / projectRisks.length)
                : 0;
            const riskLevel = escalationService.classifyRisk(managerRisk, role);

            const highRiskTeams = projectRisks.filter(p => p.risk_score >= 50);

            result.manager_risk_score = managerRisk;
            result.risk_level = riskLevel;
            result.project_risks = projectRisks;
            result.high_risk_teams = highRiskTeams;
            result.delivery_predictability = 100 - managerRisk;

            if (riskLevel === 'danger') {
                result.alerts.push({
                    type: 'danger',
                    message: `Critical Risk – Cross-team risk at ${managerRisk}%. Immediate attention required.`,
                    icon: '🔴',
                });
            } else if (riskLevel === 'warning') {
                result.alerts.push({
                    type: 'warning',
                    message: `Warning: Cross-team risk score (${managerRisk}%) has crossed threshold.`,
                    icon: '🟡',
                });
            }
        } else if (role === 'hr' || role === 'admin') {
            // Burnout probability, employee risk distribution
            const allDevs = await pool.query(
                "SELECT id, name, role, department FROM users WHERE role IN ('developer', 'team_leader') AND is_active = true"
            );

            const riskDistribution = { low: 0, medium: 0, high: 0 };
            const burnoutRisks = [];

            for (const d of allDevs.rows) {
                try {
                    const burnout = await mlAnalytics.detectBurnout(d.id);
                    if (burnout.score > 40) {
                        burnoutRisks.push({ id: d.id, name: d.name, role: d.role, burnout_score: burnout.score, level: burnout.level });
                    }
                    if (burnout.score > 65) riskDistribution.high++;
                    else if (burnout.score > 40) riskDistribution.medium++;
                    else riskDistribution.low++;
                } catch { riskDistribution.low++; }
            }

            const hrRisk = burnoutRisks.length > 0
                ? Math.round(burnoutRisks.reduce((s, b) => s + b.burnout_score, 0) / burnoutRisks.length)
                : 0;
            const riskLevel = escalationService.classifyRisk(hrRisk, role);

            result.hr_risk_score = hrRisk;
            result.risk_level = riskLevel;
            result.burnout_risks = burnoutRisks;
            result.risk_distribution = riskDistribution;
            result.total_employees = allDevs.rows.length;

            if (riskLevel === 'danger') {
                result.alerts.push({
                    type: 'danger',
                    message: `Critical: Workforce burnout risk at ${hrRisk}%. HR intervention required.`,
                    icon: '🔴',
                });
            } else if (riskLevel === 'warning') {
                result.alerts.push({
                    type: 'warning',
                    message: `Warning: Workforce burnout risk (${hrRisk}%) approaching danger zone.`,
                    icon: '🟡',
                });
            }
        }

        res.json({ success: true, metrics: result });
    } catch (error) {
        next(error);
    }
};

// POST /api/analytics/escalation-check - Manually trigger escalation
export const triggerEscalationCheck = async (req, res, next) => {
    try {
        await escalationService.runEscalationCheck();
        res.json({ success: true, message: 'Escalation check completed' });
    } catch (error) {
        next(error);
    }
};
