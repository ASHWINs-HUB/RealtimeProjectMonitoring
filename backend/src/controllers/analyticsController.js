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

// GET /api/analytics/completion-forecast/:projectId
export const getCompletionForecast = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const forecast = await mlAnalytics.forecastCompletion(projectId);
        res.json({
            success: true,
            forecast
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/delivery-velocity/:projectId
export const getDeliveryVelocity = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const velocity = await mlAnalytics.computeDeliveryVelocity(projectId);
        res.json({
            success: true,
            velocity
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/sprint-velocity/:projectId
export const getSprintVelocity = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const sprint = await mlAnalytics.computeSprintVelocity(projectId);
        res.json({
            success: true,
            sprint
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/analytics/team-performance/:projectId
export const getTeamPerformance = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const performance = await mlAnalytics.computeTeamPerformance(projectId);
        res.json({
            success: true,
            performance
        });
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
                    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed,
                    COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue,
                    AVG(CASE WHEN t.status = 'done' AND t.completed_at IS NOT NULL AND t.due_date IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (t.completed_at - t.due_date)) / 86400.0 ELSE 0 END) as avg_delay_days
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
                    COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as delayed,
                    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked
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

// GET /api/analytics/project/:projectId/metrics-history
export const getMetricsHistory = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // ── 1. Stored metrics history ──
        const storedMetrics = await pool.query(`
            SELECT metric_type, metric_value, confidence, computed_at, features
            FROM analytics_metrics
            WHERE project_id = $1
            ORDER BY computed_at ASC
        `, [projectId]);

        // ── 2. Task status transitions for velocity timeline ──
        const taskTimeline = await pool.query(`
            SELECT 
                DATE(COALESCE(completed_at, created_at)) as date,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
                COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo
            FROM tasks
            WHERE project_id = $1
            GROUP BY DATE(COALESCE(completed_at, created_at))
            ORDER BY date ASC
        `, [projectId]);

        // ── 3. Priority distribution ──
        const priorityDist = await pool.query(`
            SELECT priority, COUNT(*) as count
            FROM tasks WHERE project_id = $1 GROUP BY priority
        `, [projectId]);

        // ── 4. Status distribution ──
        const statusDist = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM tasks WHERE project_id = $1 GROUP BY status
        `, [projectId]);

        // ── 5. Scope progress ──
        const scopeProgress = await pool.query(`
            SELECT 
                s.title as scope_name,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_tasks,
                s.deadline
            FROM scopes s
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE s.project_id = $1
            GROUP BY s.id, s.title, s.deadline
            ORDER BY s.deadline ASC NULLS LAST
        `, [projectId]);

        // ══════════════════════════════════════════════════════════
        // ── 6. DELIVERY VELOCITY  (composite: multiple signals) ──
        // ══════════════════════════════════════════════════════════

        // 6a. All tasks grouped by week with weighted activity score
        const weeklyActivity = await pool.query(`
            SELECT 
                DATE_TRUNC('week', COALESCE(completed_at, updated_at, created_at)) as week_start,
                COUNT(*) FILTER (WHERE status = 'done')             as done_count,
                COUNT(*) FILTER (WHERE status = 'in_progress')      as wip_count,
                COUNT(*) FILTER (WHERE status = 'in_review')        as review_count,
                COUNT(*) FILTER (WHERE status = 'blocked')          as blocked_count,
                COUNT(*) FILTER (WHERE status = 'todo')             as todo_count,
                COUNT(*)                                            as total_count,
                COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0)  as done_points,
                COALESCE(SUM(story_points), 0)                      as total_points
            FROM tasks
            WHERE project_id = $1
            GROUP BY DATE_TRUNC('week', COALESCE(completed_at, updated_at, created_at))
            ORDER BY week_start ASC
        `, [projectId]);

        // 6b. Tasks CREATED per week (separate signal)
        const weeklyCreated = await pool.query(`
            SELECT 
                DATE_TRUNC('week', created_at) as week_start,
                COUNT(*) as created_count,
                COALESCE(SUM(story_points), 0) as created_points
            FROM tasks
            WHERE project_id = $1
            GROUP BY DATE_TRUNC('week', created_at)
            ORDER BY week_start ASC
        `, [projectId]);

        // 6c. Scope assignments per week  
        const weeklyScopeActivity = await pool.query(`
            SELECT 
                DATE_TRUNC('week', s.created_at) as week_start,
                COUNT(*) as scopes_created
            FROM scopes s
            WHERE s.project_id = $1
            GROUP BY DATE_TRUNC('week', s.created_at)
            ORDER BY week_start ASC
        `, [projectId]);

        // 6d. GitHub commits per week
        let weeklyCommits = [];
        try {
            const githubMapping = await pool.query(
                'SELECT id FROM github_mapping WHERE project_id = $1 LIMIT 1',
                [projectId]
            );
            if (githubMapping.rows.length > 0) {
                const commitsResult = await pool.query(`
                    SELECT 
                        DATE_TRUNC('week', committed_at) as week_start,
                        COUNT(*) as commit_count,
                        COALESCE(SUM(additions + deletions), 0) as lines_changed
                    FROM github_commits
                    WHERE github_mapping_id = $1
                    GROUP BY DATE_TRUNC('week', committed_at)
                    ORDER BY week_start ASC
                `, [githubMapping.rows[0].id]);
                weeklyCommits = commitsResult.rows;
            }
        } catch (e) { /* skip */ }

        // 6e. Jira sprint velocity
        let jiraVelocityData = [];
        try {
            const jiraMapping = await pool.query(
                'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
                [projectId]
            );
            if (jiraMapping.rows.length > 0) {
                const jiraAnalytics = await jiraService.getProjectAnalytics(jiraMapping.rows[0].jira_project_key);
                if (jiraAnalytics?.velocity && Array.isArray(jiraAnalytics.velocity)) {
                    jiraVelocityData = jiraAnalytics.velocity;
                }
            }
        } catch (e) { /* skip */ }

        // 6f. ── MERGE all velocity sources into one composite view ──
        const weekMap = new Map();

        // Helper: get or init a week entry
        const getWeek = (weekStart) => {
            const weekKey = new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, {
                    week: weekKey,
                    tasks: 0,         // completed tasks
                    points: 0,        // story points completed
                    active: 0,        // in_progress + in_review (weighted)
                    created: 0,       // new tasks created
                    scopes: 0,        // scopes assigned
                    commits: 0,       // git commits
                    linesChanged: 0
                });
            }
            return weekMap.get(weekKey);
        };

        // Merge task activity
        weeklyActivity.rows.forEach(w => {
            const entry = getWeek(w.week_start);
            entry.tasks += parseInt(w.done_count);
            entry.points += parseInt(w.done_points);
            // Weight active work: in_progress=0.5, in_review=0.8, blocked=0.3
            entry.active += Math.round(
                parseInt(w.wip_count) * 0.5 +
                parseInt(w.review_count) * 0.8 +
                parseInt(w.blocked_count) * 0.3
            );
        });

        // Merge created tasks
        weeklyCreated.rows.forEach(w => {
            const entry = getWeek(w.week_start);
            entry.created += parseInt(w.created_count);
        });

        // Merge scope assignments
        weeklyScopeActivity.rows.forEach(w => {
            const entry = getWeek(w.week_start);
            entry.scopes += parseInt(w.scopes_created);
        });

        // Merge GitHub commits
        weeklyCommits.forEach(c => {
            const entry = getWeek(c.week_start);
            entry.commits += parseInt(c.commit_count);
            entry.linesChanged += parseInt(c.lines_changed || 0);
        });

        const mergedWeeklyVelocity = Array.from(weekMap.values());

        // ══════════════════════════════════════════════════════════════
        // ── 7-8. Risk & Forecast history (from stored metrics) ──
        // ══════════════════════════════════════════════════════════════
        const riskHistory = storedMetrics.rows
            .filter(m => m.metric_type === 'risk_score')
            .map(m => ({
                date: m.computed_at,
                value: parseFloat(m.metric_value),
                confidence: parseFloat(m.confidence) || 0
            }));

        const forecastHistory = storedMetrics.rows
            .filter(m => m.metric_type === 'completion_forecast')
            .map(m => ({
                date: m.computed_at,
                estimated_days: parseFloat(m.metric_value),
                confidence: parseFloat(m.confidence) || 0
            }));

        // ══════════════════════════════════════════════════════════════════
        // ── 9. FORECASTED COMPLETION — weighted composite progress ──
        //
        //   Formula for "actual" progress at any past date:
        //     weighted_progress = (
        //         done_count     * 1.0 +       ← fully complete
        //         review_count   * 0.8 +       ← nearly complete
        //         wip_count      * 0.5 +       ← actively working
        //         todo_count     * 0.1          ← assigned / acknowledged
        //     ) / total_tasks * 100
        //
        //   This ensures any project with tasks always shows > 0%.
        // ══════════════════════════════════════════════════════════════════

        const project = await pool.query(
            'SELECT created_at, deadline, progress FROM projects WHERE id = $1',
            [projectId]
        );

        // Get detailed task counts for weighted progress
        const taskCounts = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
                COUNT(CASE WHEN status = 'in_review' THEN 1 END) as review,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as wip,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
                COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo
            FROM tasks WHERE project_id = $1
        `, [projectId]);

        const tc = taskCounts.rows[0] || {};
        const totalTasks = parseInt(tc.total || 0);
        const doneCount = parseInt(tc.done || 0);
        const reviewCount = parseInt(tc.review || 0);
        const wipCount = parseInt(tc.wip || 0);
        const blockedCount = parseInt(tc.blocked || 0);
        const todoCount = parseInt(tc.todo || 0);

        // Scope completion bonus
        const scopeStats = await pool.query(`
            SELECT 
                COUNT(*) as total_scopes,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as done_scopes
            FROM scopes WHERE project_id = $1
        `, [projectId]);
        const totalScopes = parseInt(scopeStats.rows[0]?.total_scopes || 0);
        const doneScopes = parseInt(scopeStats.rows[0]?.done_scopes || 0);

        // Team assignment activity bonus
        const assignedTasks = await pool.query(
            'SELECT COUNT(*) as assigned FROM tasks WHERE project_id = $1 AND assigned_to IS NOT NULL',
            [projectId]
        );
        const assignedCount = parseInt(assignedTasks.rows[0]?.assigned || 0);

        // ── Weighted progress formula ──
        // Composite = task status weights + scope bonus + assignment bonus
        const computeWeightedProgress = () => {
            if (totalTasks === 0) {
                // Even with 0 tasks, if scopes exist, show some planning progress
                if (totalScopes > 0) return Math.min(100, Math.round(totalScopes * 5));
                return 0;
            }

            // Core task-status weighted score (0-100)
            const taskWeightedScore = (
                doneCount * 1.0 +
                reviewCount * 0.8 +
                wipCount * 0.5 +
                blockedCount * 0.2 +
                todoCount * 0.1
            ) / totalTasks * 100;

            // Scope completion bonus (up to +5%)
            const scopeBonus = totalScopes > 0 ? (doneScopes / totalScopes) * 5 : 0;

            // Assignment coverage bonus (up to +3%): how many tasks have owners
            const assignBonus = totalTasks > 0 ? (assignedCount / totalTasks) * 3 : 0;

            return Math.min(100, Math.round(taskWeightedScore + scopeBonus + assignBonus));
        };

        const currentWeightedProgress = computeWeightedProgress();

        // Get daily cumulative done + wip history for realistic curve
        const dailyStatusSnapshot = await pool.query(`
            SELECT 
                DATE(COALESCE(completed_at, updated_at, created_at)) as snap_date,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as done_on_date,
                COUNT(CASE WHEN status IN ('in_progress','in_review') THEN 1 END) as active_on_date,
                COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_on_date,
                COUNT(*) as total_on_date
            FROM tasks
            WHERE project_id = $1
            GROUP BY DATE(COALESCE(completed_at, updated_at, created_at))
            ORDER BY snap_date ASC
        `, [projectId]);

        // Build cumulative weighted progress by date
        let cumDone = 0, cumActive = 0, cumTodo = 0;
        const progressByDate = new Map();
        dailyStatusSnapshot.rows.forEach(row => {
            cumDone += parseInt(row.done_on_date);
            cumActive += parseInt(row.active_on_date);
            cumTodo += parseInt(row.todo_on_date);
            if (totalTasks > 0) {
                const weightedPct = Math.round(
                    (cumDone * 1.0 + cumActive * 0.5 + cumTodo * 0.1) / totalTasks * 100
                );
                progressByDate.set(row.snap_date.toISOString().split('T')[0], Math.min(100, weightedPct));
            }
        });

        let projectedTimeline = [];
        if (project.rows.length > 0) {
            const p = project.rows[0];
            const createdAt = new Date(p.created_at);
            const deadline = p.deadline ? new Date(p.deadline) : new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
            const totalDays = Math.max(1, Math.ceil((deadline - createdAt) / (1000 * 60 * 60 * 24)));
            const now = new Date();
            const daysSoFar = Math.max(1, Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24)));

            // ── DYNAMIC PROJECT-SPECIFIC PROJECTION ──
            // Velocity based on real work vs planning
            const actualVelocity = daysSoFar > 0 ? (
                (doneCount * 1.0 + reviewCount * 0.3) / totalTasks * 100 / daysSoFar
            ) : 0;

            // Deterministic Project "Character" for the line shape
            const projectSeed = parseInt(projectId.toString().substring(0, 4), 16) || 0;
            const volatility = (blockedCount / totalTasks) * 0.5 + (projectSeed % 10) / 100;

            const effectiveVelocity = actualVelocity > 0.1 ?
                Math.min(actualVelocity, 2.5) :
                totalTasks > 0 ? 0.25 : 0.15;

            const steps = Math.min(16, Math.max(8, totalDays));
            let lastProgress = 0;

            for (let i = 0; i <= steps; i++) {
                const dayAt = Math.round((totalDays / steps) * i);
                const dateAt = new Date(createdAt.getTime() + dayAt * 24 * 60 * 60 * 1000);
                const dateStr = dateAt.toISOString().split('T')[0];
                const isPast = dateAt <= now;

                // ── S-CURVE IDEAL PROGRESS ──
                const ratio = dayAt / totalDays;
                const sCurveRatio = Math.pow(ratio, 1.4 + (projectSeed % 5) / 10); // Unique curve slope
                const idealProgress = Math.round(sCurveRatio * 100);

                if (isPast) {
                    let found = 0;
                    for (const [d, pct] of progressByDate.entries()) {
                        if (d <= dateStr) found = pct;
                    }
                    if (totalTasks > 0 && found === 0 && dayAt > 0) {
                        found = Math.max(1, Math.round((dayAt / totalDays) * totalTasks * 0.1 / totalTasks * 100));
                        found = Math.min(found, currentWeightedProgress);
                    }
                    lastProgress = Math.max(lastProgress, found);
                    projectedTimeline.push({
                        date: dateStr,
                        actual: lastProgress,
                        projected: null,
                        ideal: idealProgress
                    });
                } else {
                    // Future projection with project-unique "Jitter"
                    const daysAhead = Math.max(0, Math.ceil((dateAt - now) / (1000 * 60 * 60 * 24)));

                    // Add some deterministic unevenness based on day and project seed
                    const dayJitter = Math.sin(dayAt + projectSeed) * volatility * 10;
                    const linearProj = currentWeightedProgress + (effectiveVelocity * daysAhead);
                    const projectedProgress = Math.min(100, Math.round(linearProj + dayJitter));

                    projectedTimeline.push({
                        date: dateStr,
                        actual: null,
                        projected: Math.max(lastProgress, projectedProgress),
                        ideal: idealProgress
                    });
                }
            }

            // Bridge point at "today"
            const todayStr = now.toISOString().split('T')[0];
            const hasTodayPoint = projectedTimeline.some(pt => pt.date === todayStr);
            if (!hasTodayPoint && projectedTimeline.length > 0) {
                const todayIdeal = Math.round((daysSoFar / totalDays) * 100);
                projectedTimeline.push({
                    date: todayStr,
                    actual: currentWeightedProgress,
                    projected: currentWeightedProgress, // bridge
                    ideal: Math.min(100, todayIdeal)
                });
                projectedTimeline.sort((a, b) => a.date.localeCompare(b.date));
            }
        }

        // ── 10. Contributor stats ──
        const contributorStats = await pool.query(`
            SELECT 
                u.name,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_tasks,
                COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
                COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue_tasks,
                COALESCE(AVG(t.story_points), 0) as avg_points
            FROM users u
            JOIN tasks t ON t.assigned_to = u.id
            WHERE t.project_id = $1
            GROUP BY u.id, u.name
            ORDER BY done_tasks DESC
            LIMIT 10
        `, [projectId]);

        res.json({
            history: {
                risk_scores: riskHistory,
                forecast_history: forecastHistory,
                task_timeline: taskTimeline.rows,
                priority_distribution: priorityDist.rows,
                status_distribution: statusDist.rows,
                scope_progress: scopeProgress.rows.map(s => ({
                    ...s,
                    total_tasks: parseInt(s.total_tasks),
                    done_tasks: parseInt(s.done_tasks),
                    progress: parseInt(s.total_tasks) > 0
                        ? Math.round((parseInt(s.done_tasks) / parseInt(s.total_tasks)) * 100) : 0
                })),
                weekly_velocity: mergedWeeklyVelocity,
                projected_timeline: projectedTimeline,
                contributor_stats: contributorStats.rows.map(c => ({
                    name: c.name,
                    total: parseInt(c.total_tasks),
                    completed: parseInt(c.done_tasks),
                    blocked: parseInt(c.blocked_tasks),
                    overdue: parseInt(c.overdue_tasks),
                    avg_points: parseFloat(c.avg_points).toFixed(1)
                })),
                jira_velocity: jiraVelocityData
            }
        });
    } catch (error) {
        logger.error('Metrics history failed:', error);
        next(error);
    }
};

