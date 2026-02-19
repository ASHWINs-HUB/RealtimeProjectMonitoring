import pool from '../../../config/database.js';

export class JiraRepository {
    async getMappingByProjectId(projectId) {
        const result = await pool.query(
            'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
            [projectId]
        );
        return result.rows[0];
    }

    async getTaskByJiraKey(jiraKey, projectId) {
        const result = await pool.query(
            'SELECT task_id FROM jira_mapping WHERE jira_issue_key = $1 AND project_id = $2',
            [jiraKey, projectId]
        );
        return result.rows[0];
    }

    async updateTaskStatus(taskId, status) {
        return pool.query(
            `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND status != $1`,
            [status, taskId]
        );
    }
}

export const jiraRepository = new JiraRepository();
