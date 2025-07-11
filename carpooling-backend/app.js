require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const userRoutes = require('./routes/user.routes');
const rateLimit = require('express-rate-limit');

const app = express();

/**
 * Rate limiting middleware
 * Limits each IP to 100 requests per 15 minutes
 * Helps prevent abuse and DoS attacks
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use(limiter);

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
app.use(express.json());

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
      user: '/api/user'
    }
  });
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
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 404 handler
 * Handles requests to non-existent routes
 */
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      '/api/auth',
      '/api/trips', 
      '/api/user'
    ]
  });
});

module.exports = app;
