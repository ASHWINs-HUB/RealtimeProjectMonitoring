import Joi from 'joi';
import logger from '../utils/logger.js';

const createProjectSchema = Joi.object({
  projectName: Joi.string().required().min(1).max(100),
  projectKey: Joi.string().required().min(1).max(20).uppercase(),
  description: Joi.string().required().min(1).max(500),
  repoName: Joi.string().required().min(1).max(100).pattern(/^[a-zA-Z0-9_-]+$/),
  private: Joi.boolean().default(true),
  teamLeader: Joi.string().required().min(1).max(50),
  teamMembers: Joi.array().items(
    Joi.string().min(1).max(50)
  ).min(1).required()
});

export const validateCreateProject = (req, res, next) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);

    if (error) {
      logger.warn('Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Replace request body with validated and sanitized values
    req.body = value;
    next();
  } catch (err) {
    logger.error('Validation middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};
