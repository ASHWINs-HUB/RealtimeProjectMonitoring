import pool from '../../../config/database.js';
import logger from '../../../utils/logger.js';

export class GitHubRepository {
    async getMappingByProjectId(projectId) {
        const result = await pool.query(
            'SELECT * FROM github_mapping WHERE project_id = $1 LIMIT 1',
            [projectId]
        );
        return result.rows[0];
    }

    async getLastCommitTimestamp(mappingId) {
        const result = await pool.query(
            'SELECT committed_at FROM github_commits WHERE github_mapping_id = $1 ORDER BY committed_at DESC LIMIT 1',
            [mappingId]
        );
        return result.rows[0]?.committed_at;
    }

    async saveCommit(mappingId, commitData) {
        const {
            sha,
            authorName,
            authorEmail,
            message,
            additions,
            deletions,
            filesChanged,
            committedAt
        } = commitData;

        return pool.query(
            `INSERT INTO github_commits 
       (github_mapping_id, commit_sha, author_name, author_email, message, additions, deletions, files_changed, committed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
            [mappingId, sha, authorName, authorEmail, message, additions, deletions, filesChanged, committedAt]
        );
    }

    async updateLastSynced(mappingId) {
        return pool.query(
            'UPDATE github_mapping SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1',
            [mappingId]
        );
    }
}

export const githubRepository = new GitHubRepository();
