const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

// Handle database errors
const handleDatabaseError = (error) => {
  logger.error('Database error:', error);

  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new ConflictError('Resource already exists');
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null violation
      return new ValidationError('Required field is missing');
    case '23514': // Check violation
      return new ValidationError('Data validation failed');
    case '42P01': // Undefined table
      return new AppError('Database table not found', 500, 'DATABASE_ERROR');
    case '42703': // Undefined column
      return new AppError('Database column not found', 500, 'DATABASE_ERROR');
    case '28P01': // Invalid password
      return new AppError('Database authentication failed', 500, 'DATABASE_ERROR');
    default:
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Handle JWT errors
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  } else {
    return new UnauthorizedError('Authentication failed');
  }
};

// Handle external API errors
const handleExternalAPIError = (error, serviceName) => {
  logger.error(`${serviceName} API error:`, error);

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const message = error.response.data?.message || `${serviceName} API error`;

    if (status === 401) {
      return new UnauthorizedError(`${serviceName} authentication failed`);
    } else if (status === 403) {
      return new ForbiddenError(`${serviceName} access denied`);
    } else if (status === 404) {
      return new NotFoundError(`${serviceName} resource`);
    } else if (status >= 400 && status < 500) {
      return new ValidationError(message);
    } else {
      return new AppError(`${serviceName} service unavailable`, 503, 'EXTERNAL_API_ERROR');
    }
  } else if (error.request) {
    // The request was made but no response was received
    return new AppError(`${serviceName} service unavailable`, 503, 'EXTERNAL_API_ERROR');
  } else {
    // Something happened in setting up the request that triggered an Error
    return new AppError(`${serviceName} request failed`, 500, 'EXTERNAL_API_ERROR');
  }
};

// Main error handler middleware
const errorHandler = (error, req, res, next) => {
  let err = error;

  // Convert known errors to AppError
  if (error.name === 'ValidationError' && error.errors) {
    err = new ValidationError(error.message, error.errors);
  } else if (error.name === 'CastError') {
    err = new ValidationError('Invalid data format');
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    err = handleJWTError(error);
  } else if (error.code && error.code.startsWith('23')) {
    err = handleDatabaseError(error);
  } else if (!error.isOperational) {
    // Log unexpected errors
    logger.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    err = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  // Send error response
  const response = {
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  asyncHandler,
  handleDatabaseError,
  handleJWTError,
  handleExternalAPIError
};
