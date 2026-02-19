import pool from '../../../config/database.js';
import logger from '../../../utils/logger.js';

export class AnalyticsRepository {
    async getProjectFeatures(projectId) {
        // Task statistics
        const taskResult = await pool.query(`
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN status = 'done' THEN 1 END) as done_tasks,
            COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
            COALESCE(AVG(story_points), 0) as avg_story_points,
            COALESCE(SUM(story_points), 0) as total_points,
            COALESCE(AVG(CASE WHEN actual_hours > 0 AND estimated_hours > 0 
              THEN actual_hours / NULLIF(estimated_hours, 0) END), 1) as effort_ratio,
            COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue_tasks,
            COUNT(DISTINCT assigned_to) as unique_assignees
          FROM tasks WHERE project_id = $1
        `, [projectId]);

        const taskStats = taskResult.rows[0];

        // Project metadata
        const projectResult = await pool.query(
            'SELECT deadline, created_at, progress FROM projects WHERE id = $1',
            [projectId]
        );

        // Git statistics
        const commitResult = await pool.query(`
          SELECT 
            COUNT(*) as total_commits,
            COUNT(CASE WHEN committed_at > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_commits,
            COUNT(DISTINCT author_email) as unique_contributors
          FROM github_commits gc
          JOIN github_mapping gm ON gc.github_mapping_id = gm.id
          WHERE gm.project_id = $1
        `, [projectId]);

        return {
            taskStats,
            project: projectResult.rows[0],
            commitStats: commitResult.rows[0]
        };
    }

    async getDeveloperStats(userId) {
        const taskResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'done' AND completed_at <= due_date THEN 1 END) as on_time,
                COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) as points,
                COUNT(CASE WHEN status != 'done' THEN 1 END) as active_tasks
            FROM tasks WHERE assigned_to = $1
        `, [userId]);

        const commitResult = await pool.query(`
            SELECT COUNT(*) as late_commits
            FROM github_commits 
            WHERE author_email IN (SELECT email FROM users WHERE id = $1)
            AND (EXTRACT(HOUR FROM committed_at) >= 22 OR EXTRACT(HOUR FROM committed_at) < 6)
        `, [userId]);

        return {
            tasks: taskResult.rows[0],
            lateCommits: parseInt(commitResult.rows[0].late_commits) || 0
        };
    }

    async saveMetric(data) {
        const { projectId, userId, type, value, confidence, features, modelVersion } = data;
        try {
            await pool.query(
                `INSERT INTO analytics_metrics (project_id, user_id, metric_type, metric_value, confidence, features, model_version)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [projectId, userId, type, value, confidence, JSON.stringify(features), modelVersion]
            );
        } catch (e) {
            logger.error(`Failed to save analytic metric [${type}]:`, e.message);
        }
    }

    async getActiveProjects() {
        return pool.query("SELECT id FROM projects WHERE status NOT IN ('completed', 'cancelled')");
    }

    async getActiveDevelopers() {
        return pool.query("SELECT id FROM users WHERE role = 'developer' AND is_active = true");
    }
}

export const analyticsRepository = new AnalyticsRepository();
