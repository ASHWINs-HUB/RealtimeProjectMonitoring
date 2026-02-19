import pool from '../../../config/database.js';

export class ProjectRepository {
    async createProject(data) {
        const { name, description, projectKey, priority, deadline, budget, createdBy } = data;
        const result = await pool.query(
            `INSERT INTO projects (name, description, project_key, priority, deadline, budget, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, description, projectKey, priority, deadline, budget, createdBy]
        );
        return result.rows[0];
    }

    async getProjectById(projectId) {
        const result = await pool.query(
            `SELECT p.*, u.name as creator_name FROM projects p
             LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1`,
            [projectId]
        );
        return result.rows[0];
    }

    async assignManagers(projectId, managerIds) {
        for (const managerId of managerIds) {
            await pool.query(
                `INSERT INTO project_managers (project_id, manager_id) VALUES ($1, $2)
                 ON CONFLICT (project_id, manager_id) DO NOTHING`,
                [projectId, managerId]
            );
        }
    }

    async getProjectIntegrations(projectId) {
        const github = await pool.query('SELECT * FROM github_mapping WHERE project_id = $1', [projectId]);
        const jira = await pool.query('SELECT * FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL', [projectId]);
        return {
            github: github.rows[0] || null,
            jira: jira.rows[0] || null
        };
    }

    async updateProjectStatus(projectId, status) {
        return pool.query(
            'UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, projectId]
        );
    }
}

export const projectRepository = new ProjectRepository();
