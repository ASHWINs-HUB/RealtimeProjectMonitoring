import { gamificationRepository } from '../../infrastructure/database/repositories/GamificationRepository.js';
import logger from '../../utils/logger.js';

export class GamificationService {
    /**
     * Process an engineering event and reward the user
     */
    async handleEvent(userId, eventType, metadata = {}) {
        try {
            let xp = 0;
            const achievements = [];

            switch (eventType) {
                case 'TASK_COMPLETED':
                    xp = 50 + (metadata.storyPoints * 10 || 0);
                    if (metadata.totalCompleted === 1) achievements.push('FIRST_TASK');
                    if (metadata.onTime) xp += 20;
                    break;

                case 'PR_MERGED':
                    xp = 100;
                    achievements.push('CODE_CONTRIBUTOR');
                    break;

                case 'BUG_FIXED':
                    xp = 75;
                    if (metadata.severity === 'critical') xp += 50;
                    break;
            }

            // Log activity
            await gamificationRepository.logActivity(userId, {
                actionType: eventType,
                xpGained: xp,
                metadata,
                entityId: metadata.entityId
            });

            // Update user skills (derived from task genres)
            if (metadata.skill) {
                await gamificationRepository.updateSkillXP(userId, metadata.skill, xp);
            }

            // Award achievements
            for (const code of achievements) {
                await gamificationRepository.awardAchievement(userId, code);
            }

            logger.info(`Gamification: User ${userId} earned ${xp} XP for ${eventType}`);

            return { xp, achievements };
        } catch (error) {
            logger.error(`Gamification Service failed: ${error.message}`);
        }
    }

    async getPlayerProfile(userId) {
        return gamificationRepository.getUserStats(userId);
    }
}

export const gamificationService = new GamificationService();
