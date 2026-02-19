import Joi from 'joi';

export const validateCreateProject = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(2000).allow('', null),
    project_key: Joi.string().min(2).max(10).uppercase().pattern(/^[A-Z][A-Z0-9]*$/).allow(null, ''),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    deadline: Joi.date().iso().allow(null, ''),
    budget: Joi.number().positive().allow(null),
    create_github_repo: Joi.boolean().default(false),
    github_repo_private: Joi.boolean().default(false),
    create_jira_project: Joi.boolean().default(true),
    manager_ids: Joi.array().items(Joi.number().integer().positive())
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

export const validateCreateTask = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(2000).allow('', null),
    scope_id: Joi.number().integer().positive().allow(null),
    assigned_to: Joi.number().integer().positive().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    story_points: Joi.number().integer().min(0).max(100).default(0),
    estimated_hours: Joi.number().positive().allow(null),
    due_date: Joi.date().iso().allow(null),
    sync_jira: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

export const validateUpdateTaskStatus = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done', 'blocked').required(),
    actual_hours: Joi.number().positive().allow(null)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

export const validateCreateScope = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(2000).allow('', null),
    team_leader_id: Joi.number().integer().positive().required(),
    deadline: Joi.date().iso().allow(null)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder').required(),
    department: Joi.string().max(255).allow('', null),
    adminEmail: Joi.string().email().required(),
    adminPassword: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};
