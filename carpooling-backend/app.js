require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://carpooling-website-1.onrender.com']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Add this right after the debug middleware
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes); // This will handle all trip-related routes including pending-count
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
