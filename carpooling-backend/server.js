require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/db.config');

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

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Server startup aborted due to database connection failure');
      process.exit(1);
    }

    // Sync database models
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');

    // Start the server if database connection is successful
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();