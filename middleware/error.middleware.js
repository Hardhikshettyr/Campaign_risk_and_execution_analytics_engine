/**
 * Custom error class for expected, "operational" errors (bad input, not
 * found, etc.) so the centralized handler can distinguish them from
 * unexpected bugs and respond with the correct status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Wraps async route handlers so rejected promises are forwarded to
 * Express's error handling pipeline instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles requests to routes that don't exist.
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Centralized Express error handler. Must be registered last, after all
 * routes, with four arguments so Express recognizes it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Invalid MongoDB ObjectId passed to a route param.
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // Mongoose schema validation errors.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Duplicate key errors.
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  if (process.env.NODE_ENV !== "production" && !err.isOperational && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { AppError, asyncHandler, notFoundHandler, errorHandler };
