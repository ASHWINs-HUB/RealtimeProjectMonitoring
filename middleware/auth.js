const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const logger = require('../utils/logger');

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token or user not found',
        code: 'INVALID_TOKEN'
      });
    }

    // Remove sensitive information
    delete user.password;
    delete user.github_oauth_token;
    delete user.jira_oauth_token;
    delete user.microsoft_oauth_token;

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      logger.error('Authentication error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

// Role-based access control middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Project access control middleware
const authorizeProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!projectId) {
      return res.status(400).json({
        error: 'Project ID required',
        code: 'PROJECT_ID_REQUIRED'
      });
    }

    // HR has read-only access to all projects
    if (userRole === 'hr') {
      if (req.method !== 'GET') {
        return res.status(403).json({
          error: 'HR role has read-only access',
          code: 'READ_ONLY_ACCESS'
        });
      }
      return next();
    }

    // Check if user has access to the project
    const project = await db('projects')
      .where('id', projectId)
      .first();

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Manager has full access to their assigned projects
    if (userRole === 'manager' && project.assigned_manager === userId) {
      return next();
    }

    // Team Leader has access to projects where they are assigned as team leader
    if (userRole === 'team_leader') {
      const hasModuleAccess = await db('modules')
        .where({
          project_id: projectId,
          assigned_team_leader: userId
        })
        .first();

      if (hasModuleAccess) {
        return next();
      }
    }

    // Developer has access to projects where they are assigned tasks
    if (userRole === 'developer') {
      const hasTaskAccess = await db('tasks')
        .join('modules', 'tasks.module_id', 'modules.id')
        .where({
          'modules.project_id': projectId,
          'tasks.assigned_developer': userId
        })
        .first();

      if (hasTaskAccess) {
        return next();
      }
    }

    return res.status(403).json({
      error: 'Access denied to this project',
      code: 'PROJECT_ACCESS_DENIED'
    });

  } catch (error) {
    logger.error('Project authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Module access control middleware
const authorizeModuleAccess = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId || req.body.moduleId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!moduleId) {
      return res.status(400).json({
        error: 'Module ID required',
        code: 'MODULE_ID_REQUIRED'
      });
    }

    // HR has read-only access
    if (userRole === 'hr') {
      if (req.method !== 'GET') {
        return res.status(403).json({
          error: 'HR role has read-only access',
          code: 'READ_ONLY_ACCESS'
        });
      }
      return next();
    }

    // Get module with project info
    const module = await db('modules')
      .join('projects', 'modules.project_id', 'projects.id')
      .where('modules.id', moduleId)
      .first('modules.*', 'projects.assigned_manager');

    if (!module) {
      return res.status(404).json({
        error: 'Module not found',
        code: 'MODULE_NOT_FOUND'
      });
    }

    // Manager has full access to their project modules
    if (userRole === 'manager' && module.assigned_manager === userId) {
      return next();
    }

    // Team Leader has access to their assigned modules
    if (userRole === 'team_leader' && module.assigned_team_leader === userId) {
      return next();
    }

    // Developer has access to modules where they are assigned tasks
    if (userRole === 'developer') {
      const hasTaskAccess = await db('tasks')
        .where({
          module_id: moduleId,
          assigned_developer: userId
        })
        .first();

      if (hasTaskAccess) {
        return next();
      }
    }

    return res.status(403).json({
      error: 'Access denied to this module',
      code: 'MODULE_ACCESS_DENIED'
    });

  } catch (error) {
    logger.error('Module authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Task access control middleware
const authorizeTaskAccess = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!taskId) {
      return res.status(400).json({
        error: 'Task ID required',
        code: 'TASK_ID_REQUIRED'
      });
    }

    // HR has read-only access
    if (userRole === 'hr') {
      if (req.method !== 'GET') {
        return res.status(403).json({
          error: 'HR role has read-only access',
          code: 'READ_ONLY_ACCESS'
        });
      }
      return next();
    }

    // Get task with module and project info
    const task = await db('tasks')
      .join('modules', 'tasks.module_id', 'modules.id')
      .join('projects', 'modules.project_id', 'projects.id')
      .where('tasks.id', taskId)
      .first(
        'tasks.*',
        'modules.assigned_team_leader',
        'projects.assigned_manager'
      );

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Manager has full access to tasks in their projects
    if (userRole === 'manager' && task.assigned_manager === userId) {
      return next();
    }

    // Team Leader has access to tasks in their modules
    if (userRole === 'team_leader' && task.assigned_team_leader === userId) {
      return next();
    }

    // Developer has access to their assigned tasks
    if (userRole === 'developer' && task.assigned_developer === userId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied to this task',
      code: 'TASK_ACCESS_DENIED'
    });

  } catch (error) {
    logger.error('Task authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeProjectAccess,
  authorizeModuleAccess,
  authorizeTaskAccess
};
