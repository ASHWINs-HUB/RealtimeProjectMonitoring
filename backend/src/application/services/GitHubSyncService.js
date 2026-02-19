import { githubGraphQLClient } from '../../infrastructure/external/GitHubGraphQLClient.js';
import { githubRepository } from '../../infrastructure/database/repositories/GitHubRepository.js';
import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

export class GitHubSyncService {
    /**
     * Incremental Crawler using GraphQL Cursors and Timestamps
     */
    async syncProjectIncremental(projectId) {
        try {
            const mapping = await githubRepository.getMappingByProjectId(projectId);
            if (!mapping) return { synced: 0 };

            const { id: mappingId, repo_full_name } = mapping;
            const [owner, repo] = repo_full_name.split('/');

            // Incremental Filter: Only fetch since last sync
            const lastSyncedAt = await githubRepository.getLastCommitTimestamp(mappingId);
            const since = lastSyncedAt ? lastSyncedAt.toISOString() : null;

            let hasNextPage = true;
            let cursor = null;
            let totalSynced = 0;

            const client = await pool.connect();
            try {
                // Outer loop handles pagination across potentially 1000s of commits
                while (hasNextPage) {
                    const data = await githubGraphQLClient.fetchProjectBatch(owner, repo, cursor, since);
                    const repository = data.repository;
                    const history = repository.defaultBranchRef?.target?.history;

                    if (!history || !history.nodes.length) break;

                    await client.query('BEGIN');

                    for (const commit of history.nodes) {
                        await githubRepository.saveCommit(mappingId, {
                            sha: commit.oid,
                            authorName: commit.author?.name,
                            authorEmail: commit.author?.email,
                            message: commit.message,
                            additions: commit.additions,
                            deletions: commit.deletions,
                            filesChanged: commit.changedFilesCount,
                            committedAt: commit.committedDate
                        });
                        totalSynced++;
                    }

                    await client.query('COMMIT');

                    hasNextPage = history.pageInfo.hasNextPage;
                    cursor = history.pageInfo.endCursor;

                    // Adaptive Throttling: If quota is extremely low (< 500 points), slow down
                    const quotaRemaining = data.rateLimit?.remaining || 5000;
                    if (quotaRemaining < 500) {
                        logger.warn(`[GitHub-Adaptive] Quota critical (${quotaRemaining}). Throttling sync...`);
                        await new Promise(r => setTimeout(r, 5000)); // Pause 5s
                    }
                }

                await githubRepository.updateLastSynced(mappingId);
                logger.info(`[Sync] Finished batch sync for ${repo_full_name}. Synced: ${totalSynced}`);
                return { synced: totalSynced };

            } finally {
                client.release();
            }
        } catch (error) {
            logger.error(`GitHub Sync Engine Error: ${error.message}`);
            throw error;
        }
    }
}

export const githubSyncService = new GitHubSyncService();
