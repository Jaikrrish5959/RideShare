const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta
    });
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'sharerides-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    )
  }));
}

// Request logging helper
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    duration: `${duration}ms`,
    userId: req.user?.userId || null
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Database operation logging
logger.logDB = (operation, table, duration, error = null) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`
  };

  if (error) {
    logger.error('Database Error', { ...logData, error: error.message, stack: error.stack });
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Email operation logging
logger.logEmail = (operation, recipient, success, error = null) => {
  const logData = {
    operation,
    recipient,
    success
  };

  if (error) {
    logger.error('Email Error', { ...logData, error: error.message });
  } else {
    logger.info('Email Sent', logData);
  }
};

// Authentication logging
logger.logAuth = (action, email, success, ip, error = null) => {
  const logData = {
    action,
    email,
    success,
    ip
  };

  if (error) {
    logger.warn('Auth Error', { ...logData, error: error.message });
  } else {
    logger.info('Auth Action', logData);
  }
};

module.exports = logger;
