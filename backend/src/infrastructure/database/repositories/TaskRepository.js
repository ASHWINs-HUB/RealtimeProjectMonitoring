import pool from '../../../config/database.js';

export class TaskRepository {
    async createTask(taskData) {
        const { projectId, scopeId, title, description, assignedTo, assignedBy, priority, storyPoints, estimatedHours, dueDate } = taskData;
        const result = await pool.query(
            `INSERT INTO tasks (project_id, scope_id, title, description, assigned_to, assigned_by, priority, story_points, estimated_hours, due_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [projectId, scopeId, title, description, assignedTo, assignedBy, priority, storyPoints, estimatedHours, dueDate]
        );
        return result.rows[0];
    }

    async getTaskById(taskId) {
        const result = await pool.query(
            `SELECT t.*, jm.jira_issue_key, gm.repo_full_name, p.project_key
             FROM tasks t
             LEFT JOIN jira_mapping jm ON t.id = jm.task_id
             LEFT JOIN github_mapping gm ON t.project_id = gm.project_id
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = $1`,
            [taskId]
        );
        return result.rows[0];
    }

    async updateTask(taskId, updates) {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const result = await pool.query(
            `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
            [...values, taskId]
        );
        return result.rows[0];
    }

    async getAssignedTasks(userId) {
        const result = await pool.query(
            `SELECT t.*, p.name as project_name, p.project_key,
             u.name as assigned_by_name,
             (SELECT jm.jira_issue_key FROM jira_mapping jm WHERE jm.task_id = t.id LIMIT 1) as jira_key
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u ON t.assigned_by = u.id
             WHERE t.assigned_to = $1
             ORDER BY 
               CASE t.priority 
                 WHEN 'critical' THEN 1 
                 WHEN 'high' THEN 2 
                 WHEN 'medium' THEN 3 
                 WHEN 'low' THEN 4 
               END,
               t.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    async getProjectTasks(projectId) {
        const result = await pool.query(
            `SELECT t.*, 
             u_assigned.name as assignee_name,
             u_by.name as assigned_by_name,
             s.title as scope_title,
             (SELECT jm.jira_issue_key FROM jira_mapping jm WHERE jm.task_id = t.id LIMIT 1) as jira_key
             FROM tasks t
             LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
             LEFT JOIN users u_by ON t.assigned_by = u_by.id
             LEFT JOIN scopes s ON t.scope_id = s.id
             WHERE t.project_id = $1
             ORDER BY t.created_at DESC`,
            [projectId]
        );
        return result.rows;
    }

    async createNotification(data) {
        const { userId, title, message, type, link } = data;
        return pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, title, message, type || 'info', link]
        );
    }

    async getProjectProgress(projectId) {
        const result = await pool.query(
            `SELECT 
             COUNT(*) as total,
             COUNT(CASE WHEN status = 'done' THEN 1 END) as done
             FROM tasks WHERE project_id = $1`,
            [projectId]
        );
        return result.rows[0];
    }
}

export const taskRepository = new TaskRepository();
