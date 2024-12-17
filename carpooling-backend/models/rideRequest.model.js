const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const RideRequest = sequelize.define('RideRequest', {
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = RideRequest; 