const express = require('express');
const { db } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { authenticateToken, authorizeRoles, authorizeProjectAccess } = require('../middleware/auth');
const router = express.Router();

// Get all projects (with role-based filtering)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  let query = db('projects')
    .select('projects.*')
    .with('created_by_user', qb => {
      qb.select('name as created_by_name')
        .from('users')
        .where('users.id', '=', db.raw('projects.created_by'));
    })
    .with('manager_user', qb => {
      qb.select('name as manager_name')
        .from('users')
        .where('users.id', '=', db.raw('projects.assigned_manager'));
    });

  // Filter based on role
  if (role === 'hr') {
    // HR can see all projects
    query = query.leftJoin('created_by_user', 'created_by_user.id', 'projects.created_by')
                .leftJoin('manager_user', 'manager_user.id', 'projects.assigned_manager');
  } else if (role === 'manager') {
    // Manager can see their assigned projects
    query = query.where('assigned_manager', userId)
                .leftJoin('created_by_user', 'created_by_user.id', 'projects.created_by')
                .leftJoin('manager_user', 'manager_user.id', 'projects.assigned_manager');
  } else if (role === 'team_leader') {
    // Team Leader can see projects where they have assigned modules
    query = query.join('modules', 'projects.id', 'modules.project_id')
                .where('modules.assigned_team_leader', userId)
                .distinct()
                .leftJoin('created_by_user', 'created_by_user.id', 'projects.created_by')
                .leftJoin('manager_user', 'manager_user.id', 'projects.assigned_manager');
  } else if (role === 'developer') {
    // Developer can see projects where they have assigned tasks
    query = query.join('modules', 'projects.id', 'modules.project_id')
                .join('tasks', 'modules.id', 'tasks.module_id')
                .where('tasks.assigned_developer', userId)
                .distinct()
                .leftJoin('created_by_user', 'created_by_user.id', 'projects.created_by')
                .leftJoin('manager_user', 'manager_user.id', 'projects.assigned_manager');
  }

  const projects = await query;

  res.json({
    projects,
    count: projects.length
  });
}));

// Create project (HR only)
router.post('/', authenticateToken, authorizeRoles('hr'), asyncHandler(async (req, res) => {
  const { name, description, assigned_manager, start_date, end_date, budget } = req.body;

  if (!name || !assigned_manager) {
    throw new ValidationError('Name and assigned manager are required');
  }

  // Verify manager exists and has correct role
  const manager = await db('users')
    .where({ id: assigned_manager, role: 'manager', is_active: true })
    .first();

  if (!manager) {
    throw new ValidationError('Invalid manager assignment');
  }

  const [project] = await db('projects').insert({
    name,
    description,
    created_by: req.user.id,
    assigned_manager,
    start_date: start_date || null,
    end_date: end_date || null,
    budget: budget || null
  }).returning('*');

  res.status(201).json({
    message: 'Project created successfully',
    project
  });
}));

// Get project by ID
router.get('/:projectId', authenticateToken, authorizeProjectAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await db('projects')
    .leftJoin('users as creator', 'projects.created_by', 'creator.id')
    .leftJoin('users as manager', 'projects.assigned_manager', 'manager.id')
    .where('projects.id', projectId)
    .first(
      'projects.*',
      'creator.name as created_by_name',
      'creator.email as created_by_email',
      'manager.name as manager_name',
      'manager.email as manager_email'
    );

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get project metrics
  const metrics = await db('project_metrics')
    .where('project_id', projectId)
    .first();

  // Get modules count
  const modulesCount = await db('modules')
    .where('project_id', projectId)
    .count('* as count')
    .first();

  // Get tasks count
  const tasksCount = await db('tasks')
    .join('modules', 'tasks.module_id', 'modules.id')
    .where('modules.project_id', projectId)
    .count('* as count')
    .first();

  res.json({
    project,
    metrics,
    stats: {
      modules_count: parseInt(modulesCount.count),
      tasks_count: parseInt(tasksCount.count)
    }
  });
}));

// Update project (Manager only)
router.put('/:projectId', authenticateToken, authorizeRoles('manager'), authorizeProjectAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, status, start_date, end_date, budget } = req.body;

  const [project] = await db('projects')
    .where('id', projectId)
    .update({
      name: name || db.raw('name'),
      description: description !== undefined ? description : db.raw('description'),
      status: status || db.raw('status'),
      start_date: start_date || db.raw('start_date'),
      end_date: end_date || db.raw('end_date'),
      budget: budget !== undefined ? budget : db.raw('budget'),
      updated_at: new Date()
    })
    .returning('*');

  res.json({
    message: 'Project updated successfully',
    project
  });
}));

// Create module (Manager only)
router.post('/:projectId/modules', authenticateToken, authorizeRoles('manager'), authorizeProjectAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, assigned_team_leader, story_points } = req.body;

  if (!name || !assigned_team_leader) {
    throw new ValidationError('Name and assigned team leader are required');
  }

  // Verify team leader exists
  const teamLeader = await db('users')
    .where({ id: assigned_team_leader, role: 'team_leader', is_active: true })
    .first();

  if (!teamLeader) {
    throw new ValidationError('Invalid team leader assignment');
  }

  const [module] = await db('modules').insert({
    name,
    description,
    project_id: projectId,
    assigned_team_leader,
    story_points: story_points || 0
  }).returning('*');

  res.status(201).json({
    message: 'Module created successfully',
    module
  });
}));

// Get project modules
router.get('/:projectId/modules', authenticateToken, authorizeProjectAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const modules = await db('modules')
    .leftJoin('users as team_leader', 'modules.assigned_team_leader', 'team_leader.id')
    .where('modules.project_id', projectId)
    .select(
      'modules.*',
      'team_leader.name as team_leader_name',
      'team_leader.email as team_leader_email'
    );

  // Get task counts for each module
  const moduleIds = modules.map(m => m.id);
  if (moduleIds.length > 0) {
    const taskCounts = await db('tasks')
      .whereIn('module_id', moduleIds)
      .select('module_id')
      .count('* as count')
      .groupBy('module_id');

    const completedTaskCounts = await db('tasks')
      .whereIn('module_id', moduleIds)
      .where('status', 'done')
      .select('module_id')
      .count('* as count')
      .groupBy('module_id');

    modules.forEach(module => {
      module.tasks_count = parseInt(taskCounts.find(tc => tc.module_id === module.id)?.count || 0);
      module.completed_tasks_count = parseInt(completedTaskCounts.find(ctc => ctc.module_id === module.id)?.count || 0);
    });
  }

  res.json({
    modules,
    count: modules.length
  });
}));

module.exports = router;
