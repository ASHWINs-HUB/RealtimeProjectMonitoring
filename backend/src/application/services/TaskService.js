import { taskRepository } from '../../infrastructure/database/repositories/TaskRepository.js';
import { jiraClient } from '../../infrastructure/external/JiraClient.js';
import { githubClient } from '../../infrastructure/external/GitHubClient.js';
import { gamificationService } from './GamificationService.js';
import { jiraRepository } from '../../infrastructure/database/repositories/JiraRepository.js';
import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

export class TaskService {
    async createNewTask(taskData, assignedBy) {
        const task = await taskRepository.createTask({ ...taskData, assignedBy });

        // Auto-sync to Jira
        if (taskData.syncJira !== false) {
            try {
                const jiraMapping = await jiraRepository.getMappingByProjectId(taskData.projectId);
                if (jiraMapping) {
                    const jiraIssue = await jiraClient.request('POST', '/rest/api/3/issue', {
                        fields: {
                            project: { key: jiraMapping.jira_project_key },
                            summary: task.title,
                            description: {
                                type: 'doc',
                                version: 1,
                                content: [{
                                    type: 'paragraph',
                                    content: [{ type: 'text', text: task.description || '' }]
                                }]
                            },
                            issuetype: { name: 'Task' }
                        }
                    });

                    // Save mapping
                    await pool.query(
                        `INSERT INTO jira_mapping (project_id, task_id, jira_project_key, jira_issue_id, jira_issue_key)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [taskData.projectId, task.id, jiraMapping.jira_project_key, jiraIssue.id, jiraIssue.key]
                    );
                }
            } catch (err) {
                logger.warn(`Jira sync failed: ${err.message}`);
            }
        }

        // Notification
        if (task.assigned_to) {
            await taskRepository.createNotification({
                userId: task.assigned_to,
                title: 'New Task Assigned',
                message: `You've been assigned task: "${task.title}"`,
                link: '/tasks'
            });
        }

        return task;
    }

    async updateStatus(taskId, status, actualHours) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const taskBefore = await taskRepository.getTaskById(taskId);
            if (!taskBefore) throw new Error('Task not found');

            const updates = { status };
            if (status === 'done') updates.completed_at = new Date();
            if (actualHours !== undefined) updates.actual_hours = actualHours;

            // Perform DB Update
            const task = await taskRepository.updateTask(taskId, updates);

            // Update Project Progress inside the transaction
            const progressResult = await client.query(
                `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'done' THEN 1 END) as done
             FROM tasks WHERE project_id = $1`,
                [task.project_id]
            );
            const { total, done } = progressResult.rows[0];
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            await client.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, task.project_id]);

            // External Jira Sync (if it fails, we ROLLBACK to keep consistency)
            if (task.jira_issue_key) {
                await jiraClient.updateIssueStatus(task.jira_issue_key, status);
            }

            await client.query('COMMIT');

            // Post-commit: Async operations (not blocking the main transaction)
            if (status === 'done') {
                const onTime = task.due_date ? new Date(task.completed_at) <= new Date(task.due_date) : true;
                // Push to queue for background processing
                this._dispatchGamificationEvent(task.assigned_to, 'TASK_COMPLETED', {
                    entityId: task.id,
                    storyPoints: task.story_points,
                    onTime,
                    skill: this._guessSkillFromTitle(task.title)
                });
            }

            return { task, progress };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Task status update failed (transaction rolled back): ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async createGitBranch(taskId) {
        const task = await taskRepository.getTaskById(taskId);
        if (!task) throw new Error('Task not found');
        if (task.github_branch) throw new Error('Branch already exists');
        if (!task.repo_full_name) throw new Error('No GitHub mapping for this project');

        const [owner, repo] = task.repo_full_name.split('/');
        const jiraPart = task.jira_issue_key || `${task.project_key}-${task.id}`;
        const slug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const branchName = `feature/${jiraPart}-${slug}`;

        // Get default branch
        const repoData = await githubClient.getRepository(owner, repo);
        const refData = await githubClient.request('GET', `/repos/${owner}/${repo}/git/ref/heads/${repoData.default_branch}`);

        await githubClient.request('POST', `/repos/${owner}/${repo}/git/refs`, {
            ref: `refs/heads/${branchName}`,
            sha: refData.object.sha
        });

        const branchUrl = `https://github.com/${owner}/${repo}/tree/${branchName}`;
        await taskRepository.updateTask(taskId, {
            github_branch: branchName,
            github_branch_url: branchUrl
        });

        return { branchName, branchUrl };
    }

    _dispatchGamificationEvent(userId, actionType, data) {
        // Fire-and-forget gamification processing (non-blocking)
        (async () => {
            try {
                await gamificationService.handleEvent(userId, actionType, data);
            } catch (err) {
                logger.warn(`Gamification event dispatch failed: ${err.message}`);
            }
        })();
    }

    _guessSkillFromTitle(title) {
        const t = title.toLowerCase();
        if (t.includes('ui') || t.includes('css') || t.includes('frontend')) return 'Frontend';
        if (t.includes('api') || t.includes('db') || t.includes('backend')) return 'Backend';
        if (t.includes('test') || t.includes('qa')) return 'QA';
        return 'Engineering';
    }
}

export const taskService = new TaskService();
