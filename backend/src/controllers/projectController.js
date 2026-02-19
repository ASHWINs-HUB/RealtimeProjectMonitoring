import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { jiraService } from '../services/jiraService.js';
import { githubService } from '../services/githubService.js';

// POST /api/projects - Stakeholder proposes or HR creates project
export const createProject = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, description, project_key, priority, deadline, budget, create_github_repo, github_repo_private, manager_ids } = req.body;
    const isStakeholder = req.user.role === 'stakeholder';

    // Generate project key if not provided
    const key = project_key || name.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase();

    // 1. Create project in PostgreSQL
    const status = isStakeholder ? 'proposed' : 'pending';
    const projectResult = await client.query(
      `INSERT INTO projects (name, description, project_key, status, priority, deadline, budget, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, key, status, priority, deadline, budget, req.user.id]
    );
    const project = projectResult.rows[0];

    // If stakeholder, skip integrations and assignments for now
    if (isStakeholder) {
      await client.query(
        `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, project.id, 'proposed', 'project', project.id, JSON.stringify({ name })]
      );
      await client.query('COMMIT');
      return res.status(201).json({
        success: true,
        message: 'Project proposal submitted successfully. Waiting for HR approval.',
        project
      });
    }

    // --- HR Creation Logic (Legacy/Direct) ---
    // 2. Auto-create Jira project
    let jiraData = null;
    let jiraWarning = null;
    try {
      jiraData = await jiraService.createProject(key, name);
      await client.query(
        `INSERT INTO jira_mapping (project_id, jira_project_id, jira_project_key)
         VALUES ($1, $2, $3)`,
        [project.id, jiraData.id?.toString(), jiraData.key]
      );
      logger.info(`Jira project created: ${jiraData.key}`);
    } catch (jiraError) {
      jiraWarning = jiraError.message;
      logger.warn(`Jira project creation failed (non-blocking): ${jiraError.message}`);
    }

    // 3. Optionally create GitHub repository
    let githubData = null;
    let githubWarning = null;
    if (create_github_repo) {
      try {
        githubData = await githubService.createRepo({
          name: name.toLowerCase().replace(/\s+/g, '-'),
          description: description || `ProjectPulse: ${name}`,
          private: github_repo_private || false
        });
        await client.query(
          `INSERT INTO github_mapping (project_id, repo_name, repo_url, repo_full_name, is_private)
           VALUES ($1, $2, $3, $4, $5)`,
          [project.id, githubData.name, githubData.html_url, githubData.full_name, githubData.private]
        );
        logger.info(`GitHub repo created: ${githubData.full_name}`);
      } catch (githubError) {
        githubWarning = githubError.message;
        logger.warn(`GitHub repo creation failed (non-blocking): ${githubError.message}`);
      }
    }

    // 4. Send to managers for acceptance
    if (manager_ids && manager_ids.length > 0) {
      for (const managerId of manager_ids) {
        await client.query(
          `INSERT INTO project_managers (project_id, manager_id) VALUES ($1, $2)
           ON CONFLICT (project_id, manager_id) DO NOTHING`,
          [project.id, managerId]
        );
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, $4, $5)`,
          [managerId, 'New Project Assignment', `You have been assigned to review project "${name}"`, 'info', `/projects/${project.id}`]
        );
      }
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, project.id, 'created', 'project', project.id, JSON.stringify({ jira: jiraData?.key, github: githubData?.full_name })]
    );

    await client.query('COMMIT');

    const warnings = [];
    if (jiraWarning) warnings.push(`Jira: ${jiraWarning}`);
    if (githubWarning) warnings.push(`GitHub: ${githubWarning}`);

    res.status(201).json({
      success: true,
      message: warnings.length > 0
        ? `Project created, but some integrations failed: ${warnings.join('; ')}`
        : 'Project created successfully',
      warnings,
      project: {
        ...project,
        jira: jiraData ? { key: jiraData.key, id: jiraData.id } : null,
        github: githubData ? { url: githubData.html_url, name: githubData.name } : null
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// POST /api/projects/:id/approve - HR approves project proposal
export const approveProject = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { manager_ids, create_github_repo, github_repo_private } = req.body;

    const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const project = projectResult.rows[0];

    if (project.status !== 'proposed') {
      return res.status(400).json({ success: false, message: 'Only proposed projects can be approved' });
    }

    // 1. Update project status to pending (waiting for manager acceptance)
    await client.query('UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['pending', id]);

    // 2. Jira Integration
    let jiraData = null;
    try {
      jiraData = await jiraService.createProject(project.project_key, project.name);
      await client.query(
        `INSERT INTO jira_mapping (project_id, jira_project_id, jira_project_key)
         VALUES ($1, $2, $3)`,
        [project.id, jiraData.id?.toString(), jiraData.key]
      );
    } catch (err) {
      logger.warn(`HR Approval Jira integration failed: ${err.message}`);
    }

    // 3. GitHub Integration
    if (create_github_repo) {
      try {
        const githubData = await githubService.createRepo({
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          description: project.description || `ProjectPulse: ${project.name}`,
          private: github_repo_private || false
        });
        await client.query(
          `INSERT INTO github_mapping (project_id, repo_name, repo_url, repo_full_name, is_private)
           VALUES ($1, $2, $3, $4, $5)`,
          [project.id, githubData.name, githubData.html_url, githubData.full_name, githubData.private]
        );
      } catch (err) {
        logger.warn(`HR Approval GitHub integration failed: ${err.message}`);
      }
    }

    // 4. Assign Managers
    if (manager_ids && manager_ids.length > 0) {
      for (const managerId of manager_ids) {
        await client.query(
          `INSERT INTO project_managers (project_id, manager_id) VALUES ($1, $2)
           ON CONFLICT (project_id, manager_id) DO NOTHING`,
          [id, managerId]
        );
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, $4, $5)`,
          [managerId, 'New Project Proposal Approved', `An approved project proposal "${project.name}" needs your review.`, 'info', `/projects/${id}`]
        );
      }
    }

    // Notify stakeholder
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [project.created_by, 'Project Proposal Approved', `Your project proposal "${project.name}" has been approved by HR.`, 'success']
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Project approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// POST /api/projects/:id/reject - HR rejects project proposal
export const rejectProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE projects SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'proposed' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found or not in proposed state' });
    }

    const project = result.rows[0];

    // Notify stakeholder
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [project.created_by, 'Project Proposal Rejected', `Your project proposal "${project.name}" was rejected. Reason: ${reason || 'Not specified'}`, 'error']
    );

    res.json({ success: true, message: 'Project proposal rejected' });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects - Get projects based on user role
export const getProjects = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    const userId = parseInt(id);
    let query, params;

    switch (role) {
      case 'admin':
      case 'hr':
        // Admin and HR see all projects
        query = `
          SELECT p.*, u.name as creator_name,
            (SELECT json_agg(json_build_object('id', gm.id, 'repo_url', gm.repo_url, 'repo_name', gm.repo_name))
             FROM github_mapping gm WHERE gm.project_id = p.id) as github_repos,
            (SELECT json_agg(json_build_object('id', jm.id, 'jira_key', jm.jira_project_key))
             FROM jira_mapping jm WHERE jm.project_id = p.id AND jm.task_id IS NULL) as jira_info
          FROM projects p
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC`;
        params = [];
        break;

      case 'stakeholder':
        // Stakeholders see projects they created
        query = `
          SELECT p.*, u.name as creator_name,
            (SELECT json_agg(json_build_object('id', gm.id, 'repo_url', gm.repo_url, 'repo_name', gm.repo_name))
             FROM github_mapping gm WHERE gm.project_id = p.id) as github_repos,
            (SELECT json_agg(json_build_object('id', jm.id, 'jira_key', jm.jira_project_key))
             FROM jira_mapping jm WHERE jm.project_id = p.id AND jm.task_id IS NULL) as jira_info
          FROM projects p
          LEFT JOIN users u ON p.created_by = u.id
          WHERE p.created_by = $1
          ORDER BY p.created_at DESC`;
        params = [userId];
        break;

      case 'manager':
        // Managers see projects assigned to them
        query = `
          SELECT p.*, u.name as creator_name, pm.status as manager_status,
            (SELECT json_agg(json_build_object('id', gm.id, 'repo_url', gm.repo_url, 'repo_name', gm.repo_name))
             FROM github_mapping gm WHERE gm.project_id = p.id) as github_repos,
            (SELECT json_agg(json_build_object('id', jm.id, 'jira_key', jm.jira_project_key))
             FROM jira_mapping jm WHERE jm.project_id = p.id AND jm.task_id IS NULL) as jira_info
          FROM projects p
          JOIN project_managers pm ON p.id = pm.project_id AND pm.manager_id = $1
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC`;
        params = [userId];
        break;

      case 'team_leader':
        // Team leaders see projects where they have scopes
        query = `
          SELECT DISTINCT p.*, u.name as creator_name
          FROM projects p
          JOIN scopes s ON p.id = s.project_id AND s.team_leader_id = $1
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC`;
        params = [userId];
        break;

      case 'developer':
        // Developers see projects where they have tasks
        query = `
          SELECT DISTINCT p.*, u.name as creator_name
          FROM projects p
          JOIN tasks t ON p.id = t.project_id AND t.assigned_to = $1
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC`;
        params = [userId];
        break;

      default:
        return res.status(403).json({ success: false, message: 'Invalid role' });
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      `SELECT p.*, u.name as creator_name FROM projects p
       LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get managers
    const managers = await pool.query(
      `SELECT pm.*, u.name, u.email FROM project_managers pm
       JOIN users u ON pm.manager_id = u.id WHERE pm.project_id = $1`,
      [id]
    );

    // Get scopes
    const scopes = await pool.query(
      `SELECT s.*, u.name as team_leader_name FROM scopes s
       JOIN users u ON s.team_leader_id = u.id WHERE s.project_id = $1`,
      [id]
    );

    // Get tasks summary
    const tasksSummary = await pool.query(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY status`,
      [id]
    );

    // Get integrations
    const github = await pool.query('SELECT * FROM github_mapping WHERE project_id = $1', [id]);
    const jira = await pool.query('SELECT * FROM jira_mapping WHERE project_id = $1 AND task_id IS NULL', [id]);

    // Get latest analytics
    const analytics = await pool.query(
      `SELECT metric_type, metric_value, confidence, computed_at
       FROM analytics_metrics WHERE project_id = $1
       ORDER BY computed_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      project: {
        ...project,
        managers: managers.rows,
        scopes: scopes.rows,
        tasks_summary: tasksSummary.rows,
        github: github.rows[0] || null,
        jira: jira.rows[0] || null,
        analytics: analytics.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = ['name', 'description', 'status', 'priority', 'progress', 'deadline', 'budget'];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/accept - Manager accepts project
export const acceptProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const result = await pool.query(
      `UPDATE project_managers SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE project_id = $1 AND manager_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, managerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project assignment not found or already processed' });
    }

    // Update project status to active if at least one manager accepted
    await pool.query(
      `UPDATE projects SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending'`,
      [id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'accepted', 'project', $2)`,
      [managerId, id]
    );

    res.json({ success: true, message: 'Project accepted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/decline - Manager declines project
export const declineProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const result = await pool.query(
      `UPDATE project_managers SET status = 'declined'
       WHERE project_id = $1 AND manager_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, managerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project assignment not found or already processed' });
    }

    res.json({ success: true, message: 'Project declined' });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/stats
export const getProjectStats = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'at_risk' THEN 1 END) as at_risk_projects,
        COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_projects,
        COALESCE(AVG(progress), 0) as avg_progress
      FROM projects
    `);

    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks
      FROM tasks
    `);

    res.json({
      success: true,
      stats: {
        projects: result.rows[0],
        tasks: taskStats.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
