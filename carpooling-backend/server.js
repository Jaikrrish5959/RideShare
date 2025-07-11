require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/db.config');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');

// Import models
const User = require('./models/user.model');
const Trip = require('./models/trip.model');
const RideRequest = require('./models/rideRequest.model');

// Define all associations
Trip.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Trip, { foreignKey: 'userId' });

Trip.hasMany(RideRequest, { foreignKey: 'tripId' });
RideRequest.belongsTo(Trip, { foreignKey: 'tripId' });

RideRequest.belongsTo(User, { 
  as: 'requester',
  foreignKey: 'requesterId'
});
User.hasMany(RideRequest, {
  as: 'requests',
  foreignKey: 'requesterId'
});

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    logger.info('Starting ShareRides API Server', { 
      port: PORT, 
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    });

    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('Server startup aborted due to database connection failure');
      process.exit(1);
    }

    // Sync database models
    logger.info('Syncing database models...');
    await sequelize.sync({ alter: true });
    logger.info('Database synced successfully');

    // Start the server if database connection is successful
    const server = app.listen(PORT, () => {
      logger.info('ShareRides API Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV,
        apiUrl: `http://localhost:${PORT}/api`,
        healthCheck: `http://localhost:${PORT}/api/health`,
        metrics: `http://localhost:${PORT}/api/metrics`
      });
    });

    // Set up metrics logging interval (every 5 minutes)
    setInterval(() => {
      metrics.logSummary();
    }, 5 * 60 * 1000);

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        sequelize.close().then(() => {
          logger.info('Database connections closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        }).catch((error) => {
          logger.error('Error closing database connections', { error: error.message });
          process.exit(1);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Server startup error', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  }
}

startServer();