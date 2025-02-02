const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    // Reduce connection pool size
    pool: {
      max: 3, // Reduce from 5
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Add query logging only in development
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// Add test connection function
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    console.log('Database Configuration:', {
      name: process.env.DB_NAME,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      connected: true
    });
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

module.exports = {
  sequelize: sequelize,
  testConnection: testConnection
};
