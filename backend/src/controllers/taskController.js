import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { jiraService } from '../services/jiraService.js';
import { githubService } from '../services/githubService.js';

// POST /api/projects/:projectId/scopes - Manager creates scope for team leader
export const createScope = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { title, description, team_leader_id, deadline } = req.body;

        // Verify manager has accepted this project
        const pmCheck = await pool.query(
            `SELECT id FROM project_managers WHERE project_id = $1 AND manager_id = $2 AND status = 'accepted'`,
            [projectId, req.user.id]
        );

        if (pmCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'You must accept this project before creating scopes' });
        }

        // Verify team leader exists and has correct role
        const tlCheck = await pool.query(
            `SELECT id, name FROM users WHERE id = $1 AND role = 'team_leader'`,
            [team_leader_id]
        );

        if (tlCheck.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid team leader ID' });
        }

        const result = await pool.query(
            `INSERT INTO scopes (project_id, assigned_by, team_leader_id, title, description, deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [projectId, req.user.id, team_leader_id, title, description, deadline]
        );

        // Notify team leader
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, 'New Scope Assigned', $2, 'info', $3)`,
            [team_leader_id, `You've been assigned scope "${title}" in a project`, `/projects/${projectId}`]
        );

        res.status(201).json({ success: true, scope: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// GET /api/projects/:projectId/scopes
export const getScopes = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const result = await pool.query(
            `SELECT s.*, u.name as team_leader_name, 
        (SELECT COUNT(*) FROM tasks t WHERE t.scope_id = s.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.scope_id = s.id AND t.status = 'done') as completed_tasks
       FROM scopes s
       JOIN users u ON s.team_leader_id = u.id
       WHERE s.project_id = $1
       ORDER BY s.created_at DESC`,
            [projectId]
        );

        res.json({ success: true, scopes: result.rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/tasks - Team leader creates task
export const createTask = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { projectId } = req.params;
        const { title, description, scope_id, assigned_to, priority, story_points, estimated_hours, due_date, sync_jira } = req.body;

        // Create task in PostgreSQL
        const result = await client.query(
            `INSERT INTO tasks (project_id, scope_id, title, description, assigned_to, assigned_by, priority, story_points, estimated_hours, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [projectId, scope_id, title, description, assigned_to, req.user.id, priority, story_points, estimated_hours, due_date]
        );

        const task = result.rows[0];

        // Auto-sync to Jira as issue
        if (sync_jira !== false) {
            try {
                // Get project's Jira key
                const jiraMapping = await client.query(
                    'SELECT jira_project_key FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL LIMIT 1',
                    [projectId]
                );

                if (jiraMapping.rows.length > 0) {
                    const jiraIssue = await jiraService.createIssue(
                        jiraMapping.rows[0].jira_project_key,
                        title,
                        description || '',
                        priority
                    );

                    await client.query(
                        `INSERT INTO jira_mapping (project_id, task_id, jira_project_key, jira_issue_id, jira_issue_key)
             VALUES ($1, $2, $3, $4, $5)`,
                        [projectId, task.id, jiraMapping.rows[0].jira_project_key, jiraIssue.id, jiraIssue.key]
                    );

                    logger.info(`Jira issue created: ${jiraIssue.key} for task ${task.id}`);
                }
            } catch (jiraError) {
                logger.warn(`Jira issue creation failed (non-blocking): ${jiraError.message}`);
            }
        }

        // Notify assigned developer
        if (assigned_to) {
            await client.query(
                `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, 'New Task Assigned', $2, 'info', $3)`,
                [assigned_to, `You've been assigned task: "${title}"`, `/tasks`]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ success: true, task });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// GET /api/tasks/assigned - Developer gets their assigned tasks
export const getAssignedTasks = async (req, res, next) => {
    try {
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
            [req.user.id]
        );

        res.json({ success: true, tasks: result.rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/tasks/:taskId/create-branch
export const createTaskBranch = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // 1. Fetch task and its mappings
        const taskResult = await pool.query(`
            SELECT t.*, jm.jira_issue_key, gm.repo_full_name, p.project_key
            FROM tasks t
            LEFT JOIN jira_mapping jm ON t.id = jm.task_id
            JOIN github_mapping gm ON t.project_id = gm.project_id
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = $1
        `, [taskId]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task or GitHub mapping not found' });
        }

        const task = taskResult.rows[0];
        if (task.github_branch) {
            return res.status(400).json({ success: false, message: 'Branch already exists for this task' });
        }

        const [owner, repo] = task.repo_full_name.split('/');
        const jiraPart = task.jira_issue_key || `${task.project_key}-${task.id}`;
        const slug = task.title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const branchName = `feature/${jiraPart}-${slug}`;

        // 2. Get default branch SHA
        const repoData = await githubService.getRepository(owner, repo);
        const defaultBranch = repoData.default_branch;
        const refData = await githubService.getReference(owner, repo, `heads/${defaultBranch}`);
        const baseSHA = refData.object.sha;

        // 3. Create branch
        await githubService.createBranch(owner, repo, branchName, baseSHA);

        const branchUrl = `https://github.com/${owner}/${repo}/tree/${branchName}`;

        // 4. Update task
        await pool.query(
            'UPDATE tasks SET github_branch = $1, github_branch_url = $2 WHERE id = $3',
            [branchName, branchUrl, taskId]
        );

        res.json({
            success: true,
            branchName,
            branchUrl,
            prLink: `https://github.com/${owner}/${repo}/compare/${branchName}?expand=1`
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/tasks/:taskId/status - Developer updates task status
export const updateTaskStatus = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { taskId } = req.params;
        const { status, actual_hours } = req.body;

        const updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
        const values = [status];
        let idx = 2;

        if (status === 'done') {
            updates.push(`completed_at = CURRENT_TIMESTAMP`);
        }

        if (actual_hours !== undefined && actual_hours !== null) {
            updates.push(`actual_hours = $${idx}`);
            values.push(actual_hours);
            idx++;
        }

        values.push(taskId);

        const result = await client.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const task = result.rows[0];

        // Sync status to Jira
        try {
            const jiraMapping = await client.query(
                'SELECT jira_issue_key FROM jira_mapping WHERE task_id = $1 LIMIT 1',
                [taskId]
            );
            if (jiraMapping.rows.length > 0) {
                await jiraService.updateIssueStatus(jiraMapping.rows[0].jira_issue_key, status);
                logger.info(`Jira issue ${jiraMapping.rows[0].jira_issue_key} status updated to ${status}`);
            }
        } catch (jiraError) {
            logger.warn(`Jira sync failed (non-blocking): ${jiraError.message}`);
        }

        // Update project progress
        const progressResult = await client.query(
            `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done
       FROM tasks WHERE project_id = $1`,
            [task.project_id]
        );
        const { total, done } = progressResult.rows[0];
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        await client.query(
            'UPDATE projects SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [progress, task.project_id]
        );

        await client.query('COMMIT');

        res.json({ success: true, task, project_progress: progress });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// GET /api/projects/:projectId/tasks
export const getProjectTasks = async (req, res, next) => {
    try {
        const { projectId } = req.params;

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

        res.json({ success: true, tasks: result.rows });
    } catch (error) {
        next(error);
    }
};

// GET /api/teams - Team leader's teams
export const getTeams = async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        let query, params;

        if (role === 'team_leader') {
            query = `
        SELECT t.*, 
          (SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role))
           FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = t.id) as members
        FROM teams t WHERE t.team_leader_id = $1 ORDER BY t.created_at DESC`;
            params = [userId];
        } else if (role === 'manager' || role === 'hr') {
            query = `
        SELECT t.*, u.name as leader_name,
          (SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name, 'email', u2.email))
           FROM team_members tm JOIN users u2 ON tm.user_id = u2.id WHERE tm.team_id = t.id) as members
        FROM teams t JOIN users u ON t.team_leader_id = u.id ORDER BY t.created_at DESC`;
            params = [];
        } else {
            query = `
        SELECT t.*, u.name as leader_name
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = $1
        JOIN users u ON t.team_leader_id = u.id`;
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, teams: result.rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/teams - Create team
export const createTeam = async (req, res, next) => {
    try {
        const { name, description, project_id, member_ids } = req.body;

        const result = await pool.query(
            `INSERT INTO teams (name, team_leader_id, project_id, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, req.user.id, project_id, description]
        );

        const team = result.rows[0];

        // Add members
        if (member_ids && member_ids.length > 0) {
            for (const memberId of member_ids) {
                await pool.query(
                    `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)
           ON CONFLICT (team_id, user_id) DO NOTHING`,
                    [team.id, memberId]
                );
            }
        }

        res.status(201).json({ success: true, team });
    } catch (error) {
        next(error);
    }
};

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );

        const unreadCount = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({
            success: true,
            notifications: result.rows,
            unread_count: parseInt(unreadCount.rows[0].count)
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/notifications/:id/read
export const markNotificationRead = async (req, res, next) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// PUT /api/notifications/read-all
export const markAllNotificationsRead = async (req, res, next) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
