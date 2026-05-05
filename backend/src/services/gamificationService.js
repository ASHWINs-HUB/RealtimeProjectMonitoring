import pool from '../config/database.js';
import logger from '../utils/logger.js';

class GamificationService {
    /**
     * Award an achievement to a user if they don't already have it
     */
    async awardAchievement(userId, achievementCode) {
        try {
            const achievement = await pool.query(
                'SELECT id, xp_reward, name FROM achievements WHERE code = $1',
                [achievementCode]
            );

            if (achievement.rows.length === 0) {
                logger.warn(`Achievement code not found: ${achievementCode}`);
                return null;
            }

            const achv = achievement.rows[0];

            // Insert if not exists
            const result = await pool.query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, achievement_id) DO NOTHING
                 RETURNING *`,
                [userId, achv.id]
            );

            if (result.rows.length > 0) {
                logger.info(`User ${userId} earned achievement: ${achv.name}`);

                // Add to activity log for XP tracking
                await pool.query(
                    `INSERT INTO activity_logs (user_id, action_type, xp_gained, metadata)
                     VALUES ($1, 'ACHIEVEMENT_UNLOCKED', $2, $3)`,
                    [userId, achv.xp_reward, JSON.stringify({ achievement_code: achievementCode, achievement_name: achv.name })]
                );

                // Send notification
                await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type)
                     VALUES ($1, 'Achievement Unlocked!', $2, 'success')`,
                    [userId, `Congratulations! You've earned the "${achv.name}" badge.`]
                );

                // Update Reputation Score (Starting from 3000 base)
                await pool.query(
                    'UPDATE users SET reputation_score = reputation_score + $1 WHERE id = $2',
                    [achv.xp_reward, userId]
                );

                return achv;
            }
            return null;
        } catch (error) {
            logger.error(`Error awarding achievement ${achievementCode}:`, error);
            return null;
        }
    }

    /**
     * Evaluate task completion for potential badges
     */
    async evaluateTaskCompletion(task) {
        const userId = task.assigned_to;
        if (!userId || task.status !== 'done') return;

        const now = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;

        if (!dueDate) return;

        // Strip time for day-based comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        // 1. Check for EARLY_BIRD (at least 1 day before)
        const diffMs = dueDate - now;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays >= 1) {
            await this.awardAchievement(userId, 'EARLY_BIRD');
        }
        // 2. Check for ON_TIME_NINJA (exactly on the due date)
        else if (today.getTime() === dueDay.getTime()) {
            await this.awardAchievement(userId, 'ON_TIME_NINJA');
        }
        // 3. Check for LATE_RECOVERY (after the due date)
        else if (now > dueDate) {
            await this.awardAchievement(userId, 'LATE_RECOVERY');
        }

        // 4. CRITICAL_SMASHER (Critical priority + on time or early)
        if (task.priority === 'critical' && now <= dueDate) {
            await this.awardAchievement(userId, 'CRITICAL_SMASHER');
        }

        // 5. HIGH_SPEED_DEV (3 tasks done in one day)
        // We check how many tasks were completed TODAY by this user
        const dailyComp = await pool.query(
            `SELECT COUNT(*) FROM tasks 
             WHERE assigned_to = $1 AND status = 'done' 
             AND completed_at::date = CURRENT_DATE`,
            [userId]
        );

        if (parseInt(dailyComp.rows[0].count) >= 3) {
            await this.awardAchievement(userId, 'HIGH_SPEED_DEV');
        }
    }
}

export const gamificationService = new GamificationService();
export default gamificationService;
