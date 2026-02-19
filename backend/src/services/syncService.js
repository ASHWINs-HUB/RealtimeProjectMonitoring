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
        if (pr.state === 'closed' && !pr.merged_at) return 'blocked';
        return 'in_progress';
    }

    async syncProjectJira(projectId) {
        try {
            const mappingResult = await pool.query(
                'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
                [projectId]
            );

            if (mappingResult.rows.length === 0) return;
            const projectKey = mappingResult.rows[0].jira_project_key;

            const jiraData = await jiraService.getProjectIssues(projectKey);
            const issues = jiraData.issues || [];

            for (const issue of issues) {
                const jiraKey = issue.key;
                const jiraStatus = issue.fields.status.name;
                const internalStatus = this.mapJiraStatus(jiraStatus);

                const taskMapping = await pool.query(
                    'SELECT task_id FROM jira_mapping WHERE jira_issue_key = $1 AND project_id = $2',
                    [jiraKey, projectId]
                );

                if (taskMapping.rows.length > 0) {
                    const taskId = taskMapping.rows[0].task_id;
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

            // 1. Sync Commits
            const commits = await githubService.getCommits(owner, repo);
            for (const commit of commits) {
                await pool.query(
                    `INSERT INTO github_commits (github_mapping_id, commit_sha, author_name, author_email, message, additions, deletions, committed_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT DO NOTHING`,
                    [mappingId, commit.sha, commit.commit.author.name, commit.commit.author.email, commit.commit.message, commit.stats?.additions || 0, commit.stats?.deletions || 0, commit.commit.author.date]
                );

                const jiraMatch = commit.commit.message.match(/([A-Z]+-\d+)/);
                if (jiraMatch) {
                    const jiraKey = jiraMatch[1];
                    const taskToUpdate = await pool.query(
                        `SELECT t.id, t.status FROM tasks t 
                         JOIN jira_mapping jm ON t.id = jm.task_id 
                         WHERE jm.jira_issue_key = $1 AND t.status = 'todo' LIMIT 1`,
                        [jiraKey]
                    );

                    if (taskToUpdate.rows.length > 0) {
                        await pool.query(`UPDATE tasks SET status = 'in_progress' WHERE id = $1`, [taskToUpdate.rows[0].id]);
                        // Reciprocal Jira Update
                        await jiraService.updateIssueStatus(jiraKey, 'in_progress').catch(e => logger.warn(`Reciprocal Jira update failed: ${e.message}`));
                    }
                }
            }

            // 2. Sync Pull Requests
            const prs = await githubService.getPullRequests(owner, repo);
            for (const pr of prs) {
                const internalStatus = this.mapGitHubPRStatus(pr);
                const jiraMatch = (pr.head.ref + ' ' + pr.title).match(/([A-Z]+-\d+)/);

                if (jiraMatch) {
                    const jiraKey = jiraMatch[1];
                    const taskToUpdate = await pool.query(
                        `SELECT t.id, t.status FROM tasks t 
                         JOIN jira_mapping jm ON t.id = jm.task_id 
                         WHERE jm.jira_issue_key = $1 AND t.status != $2 LIMIT 1`,
                        [jiraKey, internalStatus]
                    );

                    if (taskToUpdate.rows.length > 0) {
                        await pool.query(`UPDATE tasks SET status = $1 WHERE id = $2`, [internalStatus, taskToUpdate.rows[0].id]);
                        // Reciprocal Jira Update
                        await jiraService.updateIssueStatus(jiraKey, internalStatus).catch(e => logger.warn(`Reciprocal Jira update failed: ${e.message}`));
                    }
                }
            }
        } catch (error) {
            logger.error(`GitHub sync failed for project ${projectId}:`, error);
        }
    }

    async syncAll() {
        logger.info('Starting external integration sync...');
        const projects = await pool.query("SELECT id FROM projects WHERE status NOT IN ('completed', 'cancelled')");
        for (const p of projects.rows) {
            await this.syncProjectJira(p.id);
            await this.syncProjectGitHub(p.id);
        }
        logger.info('External integration sync completed.');
    }
}

export const syncService = new SyncService();
