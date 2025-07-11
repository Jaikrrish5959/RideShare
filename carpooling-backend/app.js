require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const userRoutes = require('./routes/user.routes');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const { requestLogger, errorHandler, healthCheck, performanceMonitor } = require('./middleware/monitoring');

const app = express();

// Trust proxy (important for getting real IP addresses behind load balancers)
app.set('trust proxy', 1);

/**
 * Rate limiting middleware
 * Limits each IP to 100 requests per 15 minutes
 * Helps prevent abuse and DoS attacks
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
    res.status(429).json({ message: 'Too many requests, please try again later' });
  }
});

app.use(limiter);

// Monitoring middleware
app.use(performanceMonitor);
app.use(requestLogger);

// Metrics collection middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    metrics.recordRequest(req.method, res.statusCode);
  });
  next();
});

/**
 * CORS configuration
 * Allows cross-origin requests from the frontend
 * Production: Only allows requests from the deployed frontend
 * Development: Allows requests from localhost:3000
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://carpooling-website-1.onrender.com']
    : 'http://localhost:3000',
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

 /**
 * Request logging middleware
 * Logs all incoming requests for debugging purposes
 * Only active in development mode
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
  });
}

/**
 * Root endpoint
 * Provides basic API information and health check
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'ShareRides API Server',
    status: 'running',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      authentication: '/api/auth',
      trips: '/api/trips',
      user: '/api/user',
      health: '/api/health',
      metrics: '/api/metrics'
    }
  });
});

// Health check endpoint
app.get('/api/health', healthCheck);

// Metrics endpoint (protected in production)
app.get('/api/metrics', (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.get('X-Internal-Request') !== 'true') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const metricsData = metrics.getMetrics();
  logger.info('Metrics requested');
  res.json(metricsData);
});

/**
 * API Routes
 * All routes are prefixed with /api for better organization
 */
app.use('/api/auth', authRoutes);     // Authentication: signup, login, verify email
app.use('/api/trips', tripRoutes);    // Trip management: CRUD operations, ride requests
app.use('/api/user', userRoutes);     // User management: profile, settings, password

/**
 * Global error handling middleware
 * Catches all unhandled errors and returns consistent error responses
 */
app.use(errorHandler);

/**
 * 404 handler
 * Handles requests to non-existent routes
 */
app.use((req, res) => {
  logger.warn('404 Not Found', { 
    method: req.method, 
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      '/api/auth',
      '/api/trips', 
      '/api/user',
      '/api/health',
      '/api/metrics'
    ]
  });
});

// Log application startup
logger.info('ShareRides API Application initialized', {
  environment: process.env.NODE_ENV,
  nodeVersion: process.version,
  pid: process.pid
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

module.exports = app;
