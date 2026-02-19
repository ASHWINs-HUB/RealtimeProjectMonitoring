import pool from '../config/database.js';
import logger from '../utils/logger.js';

class NotificationService {
    /**
     * Sends a generic notification and logs it
     */
    async sendNotification({ userId, title, message, type = 'info', link = null, projectId = null }) {
        try {
            const result = await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userId, title, message, type, link]
            );

            logger.info(`Notification sent to user ${userId}: ${title}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Failed to send notification: ${error.message}`);
            return null;
        }
    }

    /**
     * Analyzes project risk levels and triggers high-severity alerts
     */
    async triggerRiskAlerts(projectId, riskScore, level, confidence) {
        if (level === 'critical' || level === 'high') {
            const project = await pool.query('SELECT name, created_by FROM projects WHERE id = $1', [projectId]);
            if (project.rows.length === 0) return;

            const projectName = project.rows[0].name;
            const owners = await pool.query(`
                SELECT user_id FROM project_managers WHERE project_id = $1
                UNION 
                SELECT created_by FROM projects WHERE id = $1
            `, [projectId]);

            for (const owner of owners.rows) {
                await this.sendNotification({
                    userId: owner.user_id || owner.id,
                    title: `⚠️ CRITICAL RISK: ${projectName}`,
                    message: `Project risk has reached ${riskScore}% (${level}). Confidence: ${confidence}%. Action required: review resource allocation and task blockers.`,
                    type: 'error',
                    link: `/projects/${projectId}`,
                    projectId
                });
            }
        }
    }

    /**
     * Alerts about developer burnout signals
     */
    async triggerBurnoutAlert(userId, burnoutScore, level) {
        if (level === 'critical') {
            const user = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
            const managers = await pool.query(`
                SELECT DISTINCT u.id 
                FROM users u 
                JOIN project_managers pm ON u.id = pm.manager_id
                JOIN tasks t ON pm.project_id = t.project_id
                WHERE t.assigned_to = $1
            `, [userId]);

            for (const manager of managers.rows) {
                await this.sendNotification({
                    userId: manager.id,
                    title: `🧠 Burnout Warning: ${user.rows[0].name}`,
                    message: `High burnout signals detected for ${user.rows[0].name} (Score: ${burnoutScore}). Suggesting workload redistribution or a check-in.`,
                    type: 'warning',
                    link: `/teams`,
                });
            }
        }
    }
}

export const notificationService = new NotificationService();
