import { jiraClient } from '../../infrastructure/external/JiraClient.js';
import { jiraRepository } from '../../infrastructure/database/repositories/JiraRepository.js';
import logger from '../../utils/logger.js';

export class JiraSyncService {
    mapStatus(jiraStatus) {
        const name = jiraStatus?.toLowerCase() || '';
        if (['done', 'closed', 'resolved', 'complete'].includes(name)) return 'done';
        if (['in progress', 'active', 'developing', 'started'].includes(name)) return 'in_progress';
        if (['in review', 'review', 'testing', 'qa'].includes(name)) return 'in_review';
        if (['blocked', 'on hold', 'stuck'].includes(name)) return 'blocked';
        return 'todo';
    }

    async syncProject(projectId) {
        try {
            const mapping = await jiraRepository.getMappingByProjectId(projectId);
            if (!mapping) return;

            const { jira_project_key } = mapping;
            const jiraData = await jiraClient.getProjectIssues(jira_project_key);
            const issues = jiraData.issues || [];

            for (const issue of issues) {
                const internalStatus = this.mapStatus(issue.fields.status.name);
                const taskMapping = await jiraRepository.getTaskByJiraKey(issue.key, projectId);

                if (taskMapping) {
                    await jiraRepository.updateTaskStatus(taskMapping.task_id, internalStatus);
                }
            }
            logger.info(`Successfully synced Jira issues for project ${projectId}`);
        } catch (error) {
            logger.error(`Jira Sync Service failed for project ${projectId}: ${error.message}`);
        }
    }
}

export const jiraSyncService = new JiraSyncService();
