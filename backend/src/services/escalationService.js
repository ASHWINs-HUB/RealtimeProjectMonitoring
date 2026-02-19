/**
 * ProjectPulse — Risk Escalation Service
 * ==========================================
 * Implements upward escalation chain:
 *   Developer risk > 60% → Notify Team Leader
 *   Team risk > 65%      → Notify Manager
 *   Manager risk > 70%   → Notify HR
 *
 * Role-specific alert thresholds:
 *   Developer:   Warning > 40%,  Danger > 60%
 *   Team Leader: Warning > 45%,  Danger > 65%
 *   Manager:     Warning > 50%,  Danger > 70%
 *   HR:          Warning > 60%,  Danger > 75%
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';

const ROLE_THRESHOLDS = {
    developer: { warning: 40, danger: 60 },
    team_leader: { warning: 45, danger: 65 },
    manager: { warning: 50, danger: 70 },
    hr: { warning: 60, danger: 75 },
    admin: { warning: 40, danger: 60 }, // Admin sees all
    stakeholder: { warning: 50, danger: 70 },
};

// Escalation chain (who notifies whom)
const ESCALATION_CHAIN = {
    developer: 'team_leader',
    team_leader: 'manager',
    manager: 'hr',
};

class EscalationService {
    /**
     * Get alert thresholds for a role
     */
    getThresholds(role) {
        return ROLE_THRESHOLDS[role] || ROLE_THRESHOLDS.developer;
    }

    /**
     * Classify risk level based on role thresholds
     */
    classifyRisk(riskScore, role) {
        const thresholds = this.getThresholds(role);
        if (riskScore >= thresholds.danger) return 'danger';
        if (riskScore >= thresholds.warning) return 'warning';
        return 'safe';
    }

    /**
     * Check and execute escalation for a developer
     */
    async escalateDeveloperRisk(developerId, riskScore) {
        if (riskScore <= 60) return null;

        try {
            // Find team leaders for this developer
            const leaders = await pool.query(`
                SELECT DISTINCT u.id, u.name, u.email
                FROM users u
                JOIN teams t ON t.team_leader_id = u.id
                JOIN team_members tm ON tm.team_id = t.id
                WHERE tm.user_id = $1 AND u.is_active = true
            `, [developerId]);

            // If no team found, find any active team leader
            let targets = leaders.rows;
            if (targets.length === 0) {
                const fallback = await pool.query(
                    "SELECT id, name, email FROM users WHERE role = 'team_leader' AND is_active = true LIMIT 3"
                );
                targets = fallback.rows;
            }

            const devInfo = await pool.query('SELECT name, email FROM users WHERE id = $1', [developerId]);
            const devName = devInfo.rows[0]?.name || 'Unknown Developer';

            for (const leader of targets) {
                await this.createEscalationNotification(
                    leader.id,
                    `⚠️ Developer Risk Alert: ${devName}`,
                    `${devName}'s risk score is ${riskScore}% — exceeds developer danger threshold (60%). Immediate review recommended.`,
                    'warning',
                    { source_user_id: developerId, risk_score: riskScore, escalation_type: 'developer_to_tl' }
                );
            }

            await this.logEscalation(developerId, 'developer', riskScore, targets.map(t => t.id));

            logger.info(`Escalation: Developer ${developerId} (risk: ${riskScore}%) → ${targets.length} team leaders`);
            return { escalated_to: targets.map(t => t.name), level: 'team_leader' };
        } catch (error) {
            logger.error('Developer escalation failed:', error.message);
            return null;
        }
    }

    /**
     * Check and execute escalation for a team risk
     */
    async escalateTeamRisk(teamLeaderId, teamRiskScore) {
        if (teamRiskScore <= 65) return null;

        try {
            // Find managers for projects this team leader is on
            const managers = await pool.query(`
                SELECT DISTINCT u.id, u.name, u.email
                FROM users u
                JOIN project_managers pm ON pm.manager_id = u.id
                JOIN scopes s ON s.project_id = pm.project_id
                WHERE s.team_leader_id = $1 AND u.is_active = true
            `, [teamLeaderId]);

            let targets = managers.rows;
            if (targets.length === 0) {
                const fallback = await pool.query(
                    "SELECT id, name, email FROM users WHERE role = 'manager' AND is_active = true LIMIT 3"
                );
                targets = fallback.rows;
            }

            const leaderInfo = await pool.query('SELECT name FROM users WHERE id = $1', [teamLeaderId]);
            const leaderName = leaderInfo.rows[0]?.name || 'Unknown Team Leader';

            for (const mgr of targets) {
                await this.createEscalationNotification(
                    mgr.id,
                    `🔴 Team Risk Escalation: ${leaderName}'s Team`,
                    `Team risk score is ${teamRiskScore}% — exceeds team leader danger threshold (65%). Cross-team review needed.`,
                    'error',
                    { source_user_id: teamLeaderId, risk_score: teamRiskScore, escalation_type: 'tl_to_manager' }
                );
            }

            await this.logEscalation(teamLeaderId, 'team_leader', teamRiskScore, targets.map(t => t.id));

            logger.info(`Escalation: Team Leader ${teamLeaderId} (risk: ${teamRiskScore}%) → ${targets.length} managers`);
            return { escalated_to: targets.map(t => t.name), level: 'manager' };
        } catch (error) {
            logger.error('Team escalation failed:', error.message);
            return null;
        }
    }

    /**
     * Check and execute escalation for a manager risk
     */
    async escalateManagerRisk(managerId, managerRiskScore) {
        if (managerRiskScore <= 70) return null;

        try {
            const hrUsers = await pool.query(
                "SELECT id, name, email FROM users WHERE role IN ('hr', 'admin') AND is_active = true"
            );

            const mgrInfo = await pool.query('SELECT name FROM users WHERE id = $1', [managerId]);
            const mgrName = mgrInfo.rows[0]?.name || 'Unknown Manager';

            for (const hr of hrUsers.rows) {
                await this.createEscalationNotification(
                    hr.id,
                    `🚨 Critical Risk Escalation: ${mgrName}`,
                    `Manager-level risk score is ${managerRiskScore}% — exceeds critical threshold (70%). HR/Admin intervention required.`,
                    'error',
                    { source_user_id: managerId, risk_score: managerRiskScore, escalation_type: 'manager_to_hr' }
                );
            }

            await this.logEscalation(managerId, 'manager', managerRiskScore, hrUsers.rows.map(t => t.id));

            logger.info(`Escalation: Manager ${managerId} (risk: ${managerRiskScore}%) → ${hrUsers.rows.length} HR/Admin users`);
            return { escalated_to: hrUsers.rows.map(t => t.name), level: 'hr' };
        } catch (error) {
            logger.error('Manager escalation failed:', error.message);
            return null;
        }
    }

    /**
     * Create an escalation notification
     */
    async createEscalationNotification(userId, title, message, type, metadata) {
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES ($1, $2, $3, $4)`,
                [userId, title, message, type]
            );
        } catch (err) {
            logger.warn('Failed to create escalation notification:', err.message);
        }
    }

    /**
     * Log escalation to audit trail
     */
    async logEscalation(sourceUserId, sourceRole, riskScore, targetUserIds) {
        try {
            await pool.query(
                `INSERT INTO activity_log (user_id, action, entity_type, details)
                 VALUES ($1, $2, $3, $4)`,
                [
                    sourceUserId,
                    'risk_escalation',
                    'escalation',
                    JSON.stringify({
                        source_role: sourceRole,
                        risk_score: riskScore,
                        escalated_to: targetUserIds,
                        escalation_chain: `${sourceRole} → ${ESCALATION_CHAIN[sourceRole] || 'admin'}`,
                        timestamp: new Date().toISOString(),
                    }),
                ]
            );
        } catch (err) {
            logger.warn('Failed to log escalation:', err.message);
        }
    }

    /**
     * Run full escalation check for all users
     */
    async runEscalationCheck() {
        logger.info('Running escalation check...');

        try {
            // Check all developers
            const devs = await pool.query(
                "SELECT id FROM users WHERE role = 'developer' AND is_active = true"
            );
            for (const dev of devs.rows) {
                const metric = await pool.query(
                    `SELECT metric_value FROM analytics_metrics
                     WHERE user_id = $1 AND metric_type = 'developer_performance'
                     ORDER BY computed_at DESC LIMIT 1`,
                    [dev.id]
                );
                if (metric.rows.length > 0) {
                    const riskScore = 100 - parseFloat(metric.rows[0].metric_value); // Inverse of performance
                    await this.escalateDeveloperRisk(dev.id, riskScore);
                }
            }

            // Check all team leaders (using average team risk)
            const leads = await pool.query(
                "SELECT id FROM users WHERE role = 'team_leader' AND is_active = true"
            );
            for (const lead of leads.rows) {
                const teamMetrics = await pool.query(`
                    SELECT AVG(am.metric_value) as avg_risk
                    FROM analytics_metrics am
                    JOIN tasks t ON t.assigned_to = am.user_id
                    JOIN scopes s ON s.id = t.scope_id
                    WHERE s.team_leader_id = $1
                      AND am.metric_type = 'developer_performance'
                      AND am.computed_at > NOW() - INTERVAL '24 hours'
                `, [lead.id]);

                if (teamMetrics.rows[0]?.avg_risk) {
                    const teamRisk = 100 - parseFloat(teamMetrics.rows[0].avg_risk);
                    await this.escalateTeamRisk(lead.id, teamRisk);
                }
            }

            // Check all managers (cross-team project risk)
            const managers = await pool.query(
                "SELECT id FROM users WHERE role = 'manager' AND is_active = true"
            );
            for (const mgr of managers.rows) {
                const projectMetrics = await pool.query(`
                    SELECT AVG(am.metric_value) as avg_risk
                    FROM analytics_metrics am
                    JOIN project_managers pm ON pm.project_id = am.project_id
                    WHERE pm.manager_id = $1
                      AND am.metric_type = 'risk_score'
                      AND am.computed_at > NOW() - INTERVAL '24 hours'
                `, [mgr.id]);

                if (projectMetrics.rows[0]?.avg_risk) {
                    const mgrRisk = parseFloat(projectMetrics.rows[0].avg_risk);
                    await this.escalateManagerRisk(mgr.id, mgrRisk);
                }
            }

            logger.info('Escalation check complete.');
        } catch (error) {
            logger.error('Escalation check failed:', error.message);
        }
    }
}

export const escalationService = new EscalationService();
export { ROLE_THRESHOLDS, ESCALATION_CHAIN };
