import { analyticsRepository } from '../../infrastructure/database/repositories/AnalyticsRepository.js';
import { PredictiveModels } from '../../domain/services/PredictiveModels.js';
import { notificationService } from '../../services/notificationService.js';
import logger from '../../utils/logger.js';

export class AnalyticsService {
    constructor() {
        this.modelVersion = '2.2.0-clean';
    }

    /**
     * Orchestrates the full computation for a project
     */
    async computeProjectInsights(projectId) {
        try {
            const { taskStats, project, commitStats } = await analyticsRepository.getProjectFeatures(projectId);

            const features = this._transformToFeatures(taskStats, project, commitStats);

            const risk = PredictiveModels.calculateRiskScore(features);
            const delay = PredictiveModels.predictSprintDelay(features);

            // Save results
            await Promise.all([
                analyticsRepository.saveMetric({
                    projectId,
                    type: 'risk_score',
                    value: risk.score,
                    confidence: risk.confidence,
                    features,
                    modelVersion: this.modelVersion
                }),
                analyticsRepository.saveMetric({
                    projectId,
                    type: 'sprint_delay',
                    value: delay.probability,
                    confidence: delay.confidence,
                    features,
                    modelVersion: this.modelVersion
                })
            ]);

            // Proactive Notifications
            if (risk.score > 50) {
                await notificationService.triggerRiskAlerts(projectId, risk.score, risk.level, risk.confidence);
            }

            return { risk, delay };
        } catch (error) {
            logger.error(`Analytics Service failed for project ${projectId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Orchestrates the full computation for a developer
     */
    async computeDeveloperInsights(userId) {
        try {
            const stats = await analyticsRepository.getDeveloperStats(userId);

            const performance = PredictiveModels.calculateDevPerformance(stats.tasks);
            const burnout = PredictiveModels.detectBurnout({
                active_tasks: stats.tasks.active_tasks,
                late_commits: stats.lateCommits
            });

            await Promise.all([
                analyticsRepository.saveMetric({
                    userId,
                    type: 'developer_performance',
                    value: performance.score,
                    confidence: performance.confidence,
                    features: stats.tasks,
                    modelVersion: this.modelVersion
                }),
                analyticsRepository.saveMetric({
                    userId,
                    type: 'burnout_score',
                    value: burnout.score,
                    confidence: burnout.confidence,
                    features: { activeTasks: stats.tasks.active_tasks, lateCommits: stats.lateCommits },
                    modelVersion: this.modelVersion
                })
            ]);

            if (burnout.score > 40) {
                await notificationService.triggerBurnoutAlert(userId, burnout.score, burnout.level);
            }

            return { performance, burnout };
        } catch (error) {
            logger.error(`Analytics Service failed for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Batch process all active entities
     */
    async runBatchCompute() {
        logger.info('[AnalyticsService] Starting batch ML computation...');

        const projects = await analyticsRepository.getActiveProjects();
        const devs = await analyticsRepository.getActiveDevelopers();

        const projectTasks = projects.rows.map(p => this.computeProjectInsights(p.id).catch(e => logger.error(e)));
        const devTasks = devs.rows.map(d => this.computeDeveloperInsights(d.id).catch(e => logger.error(e)));

        await Promise.all([...projectTasks, ...devTasks]);

        logger.info('[AnalyticsService] Batch ML computation completed.');
    }

    _transformToFeatures(taskStats, project, commitStats) {
        const total = parseInt(taskStats.total_tasks) || 0;
        const features = {
            total_tasks: total,
            completion_rate: total > 0 ? parseInt(taskStats.done_tasks) / total : 0,
            blocked_rate: total > 0 ? parseInt(taskStats.blocked_tasks) / total : 0,
            overdue_rate: total > 0 ? parseInt(taskStats.overdue_tasks) / total : 0,
            effort_ratio: parseFloat(taskStats.effort_ratio) || 1,
            team_size: parseInt(taskStats.unique_assignees) || 1,
            commit_frequency: (parseInt(commitStats.monthly_commits) || 0) / 30
        };

        if (project?.deadline) {
            const now = new Date();
            const deadline = new Date(project.deadline);
            const start = new Date(project.created_at);
            const totalDays = (deadline - start) / (1000 * 60 * 60 * 24);
            const daysRemaining = (deadline - now) / (1000 * 60 * 60 * 24);

            features.schedule_pressure = totalDays > 0 ? (1 - (daysRemaining / totalDays)) - features.completion_rate : 0;
        }

        return features;
    }
}

export const analyticsService = new AnalyticsService();
