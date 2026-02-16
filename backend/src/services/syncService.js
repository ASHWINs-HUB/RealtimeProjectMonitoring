import pool from '../config/database.js';
import { jiraService } from './jiraService.js';
import { githubService } from './githubService.js';
import logger from '../utils/logger.js';

class SyncService {
    /**
     * Map Jira status names to internal ProjectPulse statuses
     */
    mapJiraStatus(jiraStatus) {
        const name = jiraStatus?.toLowerCase() || '';
        if (['done', 'closed', 'resolved', 'complete'].includes(name)) return 'done';
        if (['in progress', 'active', 'developing', 'started'].includes(name)) return 'in_progress';
        if (['in review', 'review', 'testing', 'qa'].includes(name)) return 'in_review';
        if (['blocked', 'on hold', 'stuck'].includes(name)) return 'blocked';
        return 'todo';
    }

    /**
     * Map GitHub PR state to internal ProjectPulse statuses
     */
    mapGitHubPRStatus(pr) {
        if (pr.merged_at) return 'done';
        if (pr.state === 'open') return 'in_review';
        if (pr.state === 'closed' && !pr.merged_at) return 'blocked'; // Closed without merge might mean failed/blocked
        return 'in_progress';
    }

    async syncProjectJira(projectId) {
        try {
            // Get Jira mapping for this project
            const mappingResult = await pool.query(
                'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
                [projectId]
            );

            if (mappingResult.rows.length === 0) return;
            const projectKey = mappingResult.rows[0].jira_project_key;

            logger.info(`Syncing Jira for project ${projectId} (Key: ${projectKey})`);

            // Fetch issues from Jira
            const jiraData = await jiraService.getProjectIssues(projectKey);
            const issues = jiraData.issues || [];

            for (const issue of issues) {
                const jiraKey = issue.key;
                const jiraStatus = issue.fields.status.name;
                const internalStatus = this.mapJiraStatus(jiraStatus);

                // Find internal task mapped to this Jira issue
                const taskMapping = await pool.query(
                    'SELECT task_id FROM jira_mapping WHERE jira_issue_key = $1 AND project_id = $2',
                    [jiraKey, projectId]
                );

                if (taskMapping.rows.length > 0) {
                    const taskId = taskMapping.rows[0].task_id;

                    // Update internal task status
                    await pool.query(
                        `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = $2 AND status != $1`,
                        [internalStatus, taskId]
                    );
                }
            }
        } catch (error) {
            logger.error(`Jira sync failed for project ${projectId}:`, error);
        }
    }

    async syncProjectGitHub(projectId) {
        try {
            const mappingResult = await pool.query(
                'SELECT id, repo_full_name FROM github_mapping WHERE project_id = $1 LIMIT 1',
                [projectId]
            );

            if (mappingResult.rows.length === 0) return;
            const { id: mappingId, repo_full_name } = mappingResult.rows[0];
            if (!repo_full_name) return;

            const [owner, repo] = repo_full_name.split('/');
            logger.info(`Syncing GitHub for project ${projectId} (${repo_full_name})`);

            // 1. Sync Commits
            const commits = await githubService.getCommits(owner, repo);
            for (const commit of commits) {
                await pool.query(
                    `INSERT INTO github_commits (github_mapping_id, commit_sha, author_name, author_email, message, additions, deletions, committed_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT DO NOTHING`,
                    [
                        mappingId,
                        commit.sha,
                        commit.commit.author.name,
                        commit.commit.author.email,
                        commit.commit.message,
                        commit.stats?.additions || 0,
                        commit.stats?.deletions || 0,
                        commit.commit.author.date
                    ]
                );

                // Auto-advance task to in_progress if commit matches Jira key in message
                // Extract Jira-like key from message (e.g. PROJ-123)
                const jiraMatch = commit.commit.message.match(/([A-Z]+-\d+)/);
                if (jiraMatch) {
                    const jiraKey = jiraMatch[1];
                    await pool.query(
                        `UPDATE tasks t 
                         SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
                         FROM jira_mapping jm 
                         WHERE t.id = jm.task_id AND jm.jira_issue_key = $1 AND t.status = 'todo'`,
                        [jiraKey]
                    );
                }
            }

            // 2. Sync Pull Requests
            const prs = await githubService.getPullRequests(owner, repo);
            for (const pr of prs) {
                const internalStatus = this.mapGitHubPRStatus(pr);

                // Logic to link PR to task: check branch name or PR title for Jira key
                const jiraMatch = (pr.head.ref + ' ' + pr.title).match(/([A-Z]+-\d+)/);
                if (jiraMatch) {
                    const jiraKey = jiraMatch[1];
                    await pool.query(
                        `UPDATE tasks t 
                         SET status = $1, updated_at = CURRENT_TIMESTAMP
                         FROM jira_mapping jm 
                         WHERE t.id = jm.task_id AND jm.jira_issue_key = $2 AND t.status != $1`,
                        [internalStatus, jiraKey]
                    );
                }
            }
        } catch (error) {
            logger.error(`GitHub sync failed for project ${projectId}:`, error);
        }
    }

    async syncAll() {
        logger.info('Starting global synchronization of external integrations...');

        try {
            const projectsResult = await pool.query(
                "SELECT id FROM projects WHERE status NOT IN ('completed', 'cancelled')"
            );

            for (const project of projectsResult.rows) {
                await this.syncProjectJira(project.id);
                await this.syncProjectGitHub(project.id);
            }

            logger.info('Global synchronization completed.');
        } catch (error) {
            logger.error('Global synchronization failed:', error);
        }
    }
}

export const syncService = new SyncService();
