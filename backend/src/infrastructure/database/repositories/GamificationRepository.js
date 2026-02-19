import pool from '../../../config/database.js';

export class GamificationRepository {
    async logActivity(userId, data) {
        const { actionType, xpGained, metadata, entityId } = data;
        return pool.query(
            `INSERT INTO activity_logs (user_id, action_type, xp_gained, metadata, entity_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, actionType, xpGained, metadata || {}, entityId]
        );
    }

    async awardAchievement(userId, achievementCode) {
        return pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id)
             SELECT $1, id FROM achievements WHERE code = $2
             ON CONFLICT DO NOTHING`,
            [userId, achievementCode]
        );
    }

    async updateSkillXP(userId, skillName, xp) {
        return pool.query(
            `INSERT INTO user_skills (user_id, skill_name, total_xp)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, skill_name) 
             DO UPDATE SET 
                total_xp = user_skills.total_xp + EXCLUDED.total_xp,
                proficiency_level = LEAST(10, FLOOR((user_skills.total_xp + EXCLUDED.total_xp) / 1000) + 1),
                last_updated = CURRENT_TIMESTAMP`,
            [userId, skillName, xp]
        );
    }

    async getUserStats(userId) {
        const skillsResult = await pool.query(
            'SELECT skill_name, proficiency_level, total_xp FROM user_skills WHERE user_id = $1',
            [userId]
        );
        const achievementsResult = await pool.query(
            `SELECT a.name, a.description, a.code, ua.earned_at 
             FROM user_achievements ua 
             JOIN achievements a ON ua.achievement_id = a.id 
             WHERE ua.user_id = $1`,
            [userId]
        );
        return {
            skills: skillsResult.rows,
            achievements: achievementsResult.rows
        };
    }
}

export const gamificationRepository = new GamificationRepository();
