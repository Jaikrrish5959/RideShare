const logger = require('../utils/logger');

// Request timing and logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.userId || null
  });

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    originalEnd.apply(this, args);
  };

  next();
};

// Error tracking middleware
const errorHandler = (err, req, res, next) => {
  const errorData = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.userId || null,
    timestamp: new Date().toISOString()
  };

  // Log error based on severity
  if (err.status && err.status < 500) {
    logger.warn('Client Error', errorData);
  } else {
    logger.error('Server Error', errorData);
  }

  // Send error response
  const statusCode = err.status || 500;
  const message = statusCode >= 500 ? 'Internal server error' : err.message;
  
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
};

// Health check endpoint
const healthCheck = (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  };

  logger.info('Health Check', healthData);
  res.json(healthData);
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.userId || null
      });
    }
  });

  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  healthCheck,
  performanceMonitor
};
