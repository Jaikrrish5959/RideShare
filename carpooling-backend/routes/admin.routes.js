const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const RideRequest = require('../models/rideRequest.model');
const { auth, isAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to ensure all routes here are admin only
router.use(auth, isAdmin);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTrips = await Trip.count();
    const activeTrips = await Trip.count({ where: { status: 'scheduled' } });
    const pendingVerifications = await User.count({ where: { isVerified: false } });

    res.json({
      totalUsers,
      totalTrips,
      activeTrips,
      pendingVerifications
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'username', 'phoneNumber', 'isVerified', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    logger.error('Admin users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all trips
router.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.findAll({
      include: [
        { model: User, as: 'driver', attributes: ['id', 'username', 'email'] }
      ],
      order: [['departureTime', 'DESC']]
    });
    res.json(trips);
  } catch (error) {
    logger.error('Admin trips error:', error);
    res.status(500).json({ message: 'Error fetching trips' });
  }
});

module.exports = router;
