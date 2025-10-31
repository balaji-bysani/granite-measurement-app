/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */

/**
 * Global error handler middleware
 * Should be placed after all routes
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.url
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation error',
      message: err.message,
      details: err.details || [],
      timestamp: new Date().toISOString(),
      path: req.url
    };
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse = {
      error: 'Invalid data format',
      message: 'Invalid ID or data format provided',
      timestamp: new Date().toISOString(),
      path: req.url
    };
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse = {
      error: 'Service unavailable',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      path: req.url
    };
  } else if (err.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = 409;
    errorResponse = {
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
      timestamp: new Date().toISOString(),
      path: req.url
    };
  } else if (err.code === '23503') { // PostgreSQL foreign key constraint violation
    statusCode = 400;
    errorResponse = {
      error: 'Invalid reference',
      message: 'Referenced record does not exist',
      timestamp: new Date().toISOString(),
      path: req.url
    };
  } else if (err.statusCode || err.status) {
    // Error already has status code
    statusCode = err.statusCode || err.status;
    errorResponse = {
      error: err.name || 'Error',
      message: err.message,
      details: err.details || null,
      timestamp: new Date().toISOString(),
      path: req.url
    };
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.originalError = err;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Should be placed before global error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.url}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request timeout handler
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new Error('Request timeout');
      error.statusCode = 408;
      next(error);
    });
    next();
  };
};

/**
 * Rate limiting error handler
 */
const rateLimitErrorHandler = (req, res, next) => {
  const error = new Error('Too many requests, please try again later');
  error.statusCode = 429;
  next(error);
};

/**
 * Validation error formatter
 */
const formatValidationError = (errors) => {
  if (Array.isArray(errors)) {
    return errors;
  }
  
  if (typeof errors === 'object' && errors !== null) {
    return Object.entries(errors).map(([field, message]) => ({
      field,
      message
    }));
  }
  
  return [{ message: errors?.toString() || 'Validation failed' }];
};

/**
 * Create standardized error response
 */
const createErrorResponse = (message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncErrorHandler,
  timeoutHandler,
  rateLimitErrorHandler,
  formatValidationError,
  createErrorResponse
};