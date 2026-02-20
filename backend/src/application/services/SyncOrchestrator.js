import pool from '../../config/database.js';
import { githubSyncService } from './GitHubSyncService.js';
import { jiraSyncService } from './JiraSyncService.js';
import logger from '../../utils/logger.js';
import pLimit from 'p-limit';

/**
 * Enterprise Worker-based Orchestrator
 * This eliminates the risk of DB pool exhaustion and API bursting.
 */
export class SyncOrchestrator {
    constructor() {
        // PRODUCTION LIMIT: Never more than 5 parallel sync processes.
        // This ensures the Node.js Event Loop stays responsive.
        this.concurrencyLimit = pLimit(5);
        this.syncState = new Map(); // Prevent overlapping syncs for the same project
    }

    async syncAllProjects() {
        logger.info('[SyncOrchestrator] Multi-service Sync Cycle Initiated');

        try {
            const projects = await pool.query(
                "SELECT id FROM projects WHERE status NOT IN ('completed', 'cancelled')"
            );

            const jobs = projects.rows.map((project) =>
                this.concurrencyLimit(async () => {
                    // Locking Mechanism: Prevent duplicate syncs for the same entity
                    if (this.syncState.get(project.id)) {
                        logger.warn(`Project ${project.id} is already syncing. Skipping...`);
                        return;
                    }

                    this.syncState.set(project.id, true);

                    try {
                        logger.debug(`[Worker] Processing project: ${project.id}`);

                        // Check if integrations are configured before syncing
                        const jiraConfigured = process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN;
                        const githubConfigured = process.env.GITHUB_TOKEN;

                        const syncPromises = [];
                        if (jiraConfigured) {
                            syncPromises.push(jiraSyncService.syncProject(project.id));
                        } else {
                            logger.debug(`[Worker] Skipping Jira sync for project ${project.id} - not configured`);
                        }

                        if (githubConfigured) {
                            syncPromises.push(githubSyncService.syncProjectIncremental(project.id));
                        } else {
                            logger.debug(`[Worker] Skipping GitHub sync for project ${project.id} - not configured`);
                        }

                        // Execute incremental syncing only if integrations are configured
                        if (syncPromises.length > 0) {
                            await Promise.all(syncPromises);
                        } else {
                            logger.info(`[Worker] No integrations configured for project ${project.id} - skipping sync`);
                        }
                    } catch (err) {
                        logger.error(`[Worker-Error] Project ${project.id}: ${err.message}`);
                    } finally {
                        this.syncState.delete(project.id);
                    }
                })
            );

            await Promise.all(jobs);
            logger.info('[SyncOrchestrator] Sync cycle finished.');
        } catch (error) {
            logger.error(`[SyncOrchestrator] Fatal breakdown: ${error.message}`);
        }
    }
}

export const syncOrchestrator = new SyncOrchestrator();
