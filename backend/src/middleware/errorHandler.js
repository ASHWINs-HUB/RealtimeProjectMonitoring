import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id
  });

  // PostgreSQL specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with that data already exists.'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.'
    });
  }

  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Data validation constraint violated.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.isJoi || err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation error.',
      details: err.details || []
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default errorHandler;
