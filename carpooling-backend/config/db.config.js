const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'carpooling_wlx7', // database name
  'carpooling_wlx7_user', // username
  process.env.DB_PASSWORD, // password from environment variable
  {
    host: 'dpg-otheb2jtq21c739mjtjg-a',
    port: 5432,
    dialect: 'postgres', // Change this from 'mysql' to 'postgres'
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
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
