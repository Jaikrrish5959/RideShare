const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Trip = require('../models/trip.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const RideRequest = require('../models/rideRequest.model');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const emailService = require('../services/email.service');
const { tripValidation } = require('../middleware/tripValidation');
const { cache, cacheHelpers } = require('../utils/cache');
const logger = require('../utils/logger');

// Cache key generators
const generateTripCacheKey = (query) => {
  const { start_point, destination, date } = query;
  return cacheHelpers.generateKey('trips', start_point || 'all', destination || 'all', date || 'all');
};

const generateUserTripsCacheKey = (userId) => {
  return cacheHelpers.generateKey('user_trips', userId);
};

// Define specific routes first (before more general routes)
router.get('/requests/pending-count', auth, async (req, res) => {
  console.log('Hit pending-count route');
  try {
    const userId = req.user.userId;
    console.log('User ID from token:', userId);
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

    // Get only incoming requests that are pending and not expired
    const pendingRequests = await RideRequest.count({
      include: [{
        model: Trip,
        where: {
          userId: userId,
          date: {
            [Op.gte]: twoHoursAgo.toISOString().split('T')[0]
          }
        },
        required: true
      }],
      where: {
        status: 'pending'
      }
    });

    console.log('Pending requests count for user', userId, ':', pendingRequests);
    res.json({ count: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    res.status(500).json({ message: 'Failed to fetch pending requests count' });
  }
});

// Create a new trip
router.post('/', auth, tripValidation, async (req, res) => {
  try {
    // Add phone number validation
    const user = await User.findByPk(req.user.userId);
    if (!user.phoneNumber) {
      return res.status(403).json({ 
        message: 'Please set your phone number in settings before posting a trip'
      });
    }

    console.log('Received trip creation request');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    console.log('Validation result:', validationResult(req));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const trip = await Trip.create({
      ...req.body,
      userId: req.user.userId
    });

    // Invalidate related caches
    const userTripsKey = generateUserTripsCacheKey(req.user.userId);
    cache.delete(userTripsKey);
    
    // Clear general trip listings cache
    const cachePattern = cacheHelpers.generateKey('trips');
    for (const [key] of cache.cache.entries()) {
      if (key.startsWith(cachePattern)) {
        cache.delete(key);
      }
    }

    console.log('Trip created successfully:', trip.toJSON());
    res.status(201).json(trip);
  } catch (error) {
    console.error('Trip creation error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      sql: error.sql,  // For SQL errors
      original: error.original  // For Sequelize errors
    });
    res.status(500).json({ 
      message: 'Failed to create trip',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all trips or search trips with caching
router.get('/', auth, async (req, res) => {
  try {
    const cacheKey = generateTripCacheKey(req.query);
    
    // Try to get from cache first
    const cachedTrips = cache.get(cacheKey);
    if (cachedTrips) {
      console.log('Trips cache hit', { cacheKey });
      return res.json(cachedTrips);
    }

    const { start_point, destination, date } = req.query;

    // Build the where clause based on search parameters
    const whereClause = {};
    if (start_point) whereClause.start_point = start_point;
    if (destination) whereClause.destination = destination;
    if (date) whereClause.date = date;

    // Add condition to only show trips with available seats
    whereClause.seats_available = {
      [Op.gt]: 0  // Greater than 0
    };

    const trips = await Trip.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        },
        {
          model: RideRequest,
          attributes: ['status'],
          where: { status: 'pending' },
          required: false
        }
      ],
      order: [
        ['date', 'ASC'],
        ['time', 'ASC']
      ]
    });

    // Add pending requests count to each trip
    const tripsWithCount = trips.map(trip => ({
      ...trip.toJSON(),
      pendingRequestsCount: trip.RideRequests ? trip.RideRequests.length : 0
    }));

    // Cache for 2 minutes (trips data changes frequently)
    cache.set(cacheKey, tripsWithCount, 120);
    console.log('Trips cached', { cacheKey, count: tripsWithCount.length });

    res.json(tripsWithCount);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Failed to fetch trips' });
  }
});

// Add this route after your existing routes
router.delete('/:tripId', auth, async (req, res) => {
  const tripId = req.params.tripId;
  const userId = req.user.userId;

  try {
    // Find the trip with all its requests and requester information
    const trip = await Trip.findOne({
      where: { id: tripId, userId },
      include: [{
        model: RideRequest,
        include: [{
          model: User,
          as: 'requester',
          attributes: ['id', 'email']
        }]
      }]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    // Notify all riders (both accepted and pending) about the cancellation
    if (trip.RideRequests && trip.RideRequests.length > 0) {
      await Promise.all(trip.RideRequests.map(request => 
        emailService.sendTripCancellationNotification(
          request.requester.email,
          trip
        )
      ));
    }

    // Delete the trip (this will cascade delete all associated ride requests)
    await trip.destroy();

    // Invalidate caches
    const userTripsKey = generateUserTripsCacheKey(userId);
    cache.delete(userTripsKey);
    
    // Clear general trip listings cache
    const cachePattern = cacheHelpers.generateKey('trips');
    for (const [key] of cache.cache.entries()) {
      if (key.startsWith(cachePattern)) {
        cache.delete(key);
      }
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ 
      message: 'Failed to delete trip',
      error: error.message 
    });
  }
});

// Request to join a trip
router.post('/:tripId/request', auth, async (req, res) => {
  try {
    const requester = await User.findByPk(req.user.userId);
    if (!requester.phoneNumber) {
      return res.status(403).json({ 
        message: 'Please set your phone number in settings before requesting rides'
      });
    }

    const tripId = req.params.tripId;
    const requesterId = req.user.userId;
    const { message } = req.body;

    try {
      // Find the trip with its owner's information
      const trip = await Trip.findOne({
        where: { id: tripId },
        include: [{
          model: User,
          attributes: ['id', 'email', 'username']
        }]
      });

      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Check if user is trying to request their own trip
      if (trip.userId === requesterId) {
        return res.status(400).json({ message: 'You cannot request your own trip' });
      }

      // Check if user has already requested this trip
      const existingRequest = await RideRequest.findOne({
        where: { tripId, requesterId }
      });

      if (existingRequest) {
        return res.status(400).json({ message: 'You have already requested this trip' });
      }

      // Create the ride request
      const request = await RideRequest.create({
        tripId,
        requesterId,
        message,
        status: 'pending'
      });

      // Get requester information for the email
      const requester = await User.findByPk(requesterId, {
        attributes: ['id', 'email', 'username']
      });

      // Send email notification to the trip owner
      await emailService.sendNewRideRequestNotification(
        trip.User.email,
        { ...request.toJSON(), requester },
        trip
      );

      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating ride request:', error);
      res.status(500).json({ 
        message: 'Failed to create ride request',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Ride request error:', {
      tripId: req.params.tripId,
      userId: req.user.userId
    });
    res.status(500).json({ 
      message: 'Failed to process ride request'
    });
  }
});

// Get all ride requests (both incoming and outgoing)
router.get('/requests', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get requests for trips I own (incoming)
    const incomingRequests = await RideRequest.findAll({
      include: [
        {
          model: Trip,
          where: { userId: userId },
          required: true,
          attributes: ['start_point', 'destination', 'date', 'time', 'seats_available', 'userId'],
          include: [{
            model: User,
            attributes: ['username', 'email', 'phoneNumber']
          }]
        },
        {
          model: User,
          as: 'requester',
          required: true,
          attributes: ['id', 'email', 'username', 'phoneNumber']
        }
      ]
    });

    // Get requests I've made (outgoing)
    const outgoingRequests = await RideRequest.findAll({
      where: { requesterId: userId },
      include: [
        {
          model: Trip,
          required: true,
          attributes: ['start_point', 'destination', 'date', 'time', 'seats_available', 'userId'],
          include: [{
            model: User,
            required: true,
            attributes: ['username', 'email', 'phoneNumber']
          }]
        }
      ]
    });

    res.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests
    });
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    res.status(500).json({ message: 'Failed to fetch ride requests' });
  }
});

// Accept/Reject ride request
router.put('/requests/:requestId', auth, async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const userId = req.user.userId;

  try {
    const result = await sequelize.transaction(async (t) => {
      const request = await RideRequest.findByPk(requestId, {
        include: [{ 
          model: Trip,
          attributes: ['userId', 'seats_available', 'id']
        }],
        transaction: t
      });

      if (!request) {
        throw new Error('Request not found');
      }

      // Verify the trip belongs to the current user
      if (request.Trip.userId !== userId) {
        throw new Error('Not authorized to update this request');
      }

      if (status === 'accepted') {
        const trip = await Trip.findByPk(request.Trip.id, {
          lock: true,  // Lock the row to prevent race conditions
          transaction: t
        });
        
        if (!trip) {
          throw new Error('Trip not found');
        }

        if (trip.seats_available <= 0) {
          // Auto-reject this request and all pending requests
          const pendingRequests = await RideRequest.findAll({
            where: {
              tripId: trip.id,
              status: 'pending'
            },
            transaction: t
          });

          // Update all pending requests to rejected
          await Promise.all(pendingRequests.map(async (req) => {
            req.status = 'rejected';
            req.message = 'No seats available';
            await req.save({ transaction: t });
            
            await emailService.sendRideRequestUpdate(
              req.requesterId,
              'rejected',
              'No seats available for this trip'
            );
          }));

          throw new Error('No seats available');
        }

        // Decrease available seats
        trip.seats_available -= 1;
        await trip.save({ transaction: t });

        // If this was the last seat, reject all other pending requests
        if (trip.seats_available === 0) {
          const pendingRequests = await RideRequest.findAll({
            where: {
              tripId: trip.id,
              status: 'pending',
              id: { [Op.ne]: requestId } // Exclude current request
            },
            transaction: t
          });

          await Promise.all(pendingRequests.map(async (req) => {
            req.status = 'rejected';
            req.message = 'No more seats available';
            await req.save({ transaction: t });
            
            await emailService.sendRideRequestUpdate(
              req.requesterId,
              'rejected',
              'No more seats available for this trip'
            );
          }));
        }
      }

      request.status = status;
      await request.save({ transaction: t });

      // Send notification to user
      await emailService.sendRideRequestUpdate(
        request.requesterId,
        status,
        status === 'accepted' ? 
          'Your ride request has been accepted!' : 
          'Your ride request has been rejected.'
      );

      return request;
    });

    res.json({ message: 'Request updated successfully', request: result });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update request' 
    });
  }
});

// Update a trip
router.put('/:tripId', auth, tripValidation, async (req, res) => {
  try {
    // Check validation results first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const tripId = req.params.tripId;
    const userId = req.user.userId;
    const { start_point, destination, date, time, seats_available } = req.body;

    console.log('Received update request:', {
      tripId,
      userId,
      start_point,
      destination,
      date,
      time,
      seats_available
    });

    // Find the trip with its accepted requests count
    const trip = await Trip.findOne({
      where: { id: tripId, userId },
      include: [{
        model: RideRequest,
        where: { status: 'accepted' },
        required: false,
        include: [{
          model: User,
          as: 'requester',
          attributes: ['email']
        }]
      }]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Store old trip details for comparison
    const oldTrip = { ...trip.toJSON() };

    const newSeatsAvailable = parseInt(seats_available, 10);

    // Update trip details without checking accepted requests count
    await trip.update({
      start_point,
      destination,
      date,
      time,
      seats_available: newSeatsAvailable
    });

    // Notify accepted riders about the changes
    if (trip.RideRequests && trip.RideRequests.length > 0) {
      const changes = [];
      if (oldTrip.start_point !== start_point) changes.push(`Start point changed to ${start_point}`);
      if (oldTrip.destination !== destination) changes.push(`Destination changed to ${destination}`);
      if (oldTrip.date !== date) changes.push(`Date changed to ${date}`);
      if (oldTrip.time !== time) changes.push(`Time changed to ${time}`);
      if (oldTrip.seats_available !== newSeatsAvailable) changes.push(`Available seats changed to ${newSeatsAvailable}`);
      
      if (changes.length > 0) {
        const message = changes.join('\n');
        await Promise.all(trip.RideRequests.map(request => {
          if (request.requester && request.requester.email) {
            return emailService.sendTripUpdateNotification(
              request.requester.email,
              message,
              trip
            );
          }
          console.log('Skipping notification for request without valid requester email:', request.id);
          return Promise.resolve();
        }));
      }
    }

    // Invalidate caches after update
    const userTripsKey = generateUserTripsCacheKey(userId);
    cache.delete(userTripsKey);
    
    // Clear general trip listings cache
    const cachePattern = cacheHelpers.generateKey('trips');
    for (const [key] of cache.cache.entries()) {
      if (key.startsWith(cachePattern)) {
        cache.delete(key);
      }
    }

    res.json({ message: 'Trip updated successfully' });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ 
      message: 'Failed to update trip',
      error: error.message 
    });
  }
});

// Update the my-trips route with caching
router.get('/my-trips', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = generateUserTripsCacheKey(userId);
    
    // Try cache first
    const cachedTrips = cache.get(cacheKey);
    if (cachedTrips) {
      console.log('User trips cache hit', { userId, cacheKey });
      return res.json(cachedTrips);
    }

    // Get trips posted by the user
    const postedTrips = await Trip.findAll({
      where: { userId },
      include: [{
        model: RideRequest,
        attributes: ['id', 'status']
      }],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    // Get trips where user is a participant (has an accepted request)
    const participatingTrips = await Trip.findAll({
      include: [{
        model: RideRequest,
        where: { 
          requesterId: userId,
          status: 'accepted'
        },
        required: true
      }],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    // Add a flag to distinguish between posted and participating trips
    const formattedPostedTrips = postedTrips.map(trip => ({
      ...trip.toJSON(),
      isOwner: true
    }));

    const formattedParticipatingTrips = participatingTrips.map(trip => ({
      ...trip.toJSON(),
      isOwner: false
    }));

    // Combine and sort all trips by date and time
    const allTrips = [...formattedPostedTrips, ...formattedParticipatingTrips]
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        return dateComparison !== 0 ? dateComparison : a.time.localeCompare(b.time);
      });

    // Cache user trips for 5 minutes
    cache.set(cacheKey, allTrips, 300);
    console.log('User trips cached', { userId, cacheKey, count: allTrips.length });

    res.json(allTrips);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trips',
      error: error.message 
    });
  }
});

module.exports = router;