const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

// Add the signup route if it's missing
router.post('/signup', async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    logger.info('User signup attempt', { email, ip });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.logAuth('signup_failed', email, false, ip, new Error('Email already registered'));
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now

    // Create user
    const user = await User.create({
      email,
      password, // Assuming you have password hashing in your User model
      verificationToken,
      verificationTokenExpires,
      isVerified: true
    });

    // Send verification email in background (don't wait for it)
    emailService.sendVerificationEmail(email, verificationToken).catch(err => logger.error('Email sending failed', err));

    const duration = Date.now() - startTime;
    logger.logAuth('signup_success', email, true, ip);
    metrics.recordUserAction('registrations');
    logger.info('User registration successful', { 
      email, 
      userId: user.id, 
      duration: `${duration}ms` 
    });

    res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logAuth('signup_error', email, false, ip, error);
    logger.error('Signup error', { 
      email, 
      duration: `${duration}ms`,
      error: error.message 
    });
    res.status(500).json({ message: error.message });
  }
});

// Add email verification route
router.get('/verify-email', async (req, res) => {
  const startTime = Date.now();
  const { token } = req.query;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    logger.info('Email verification attempt', { token: token?.substring(0, 8) + '...', ip });

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          [Op.gt]: new Date() // Current time
        },
        isVerified: false
      },
      attributes: ['id', 'email', 'isVerified', 'verificationTokenExpires'] // Only select needed fields
    });

    if (!user) {
      logger.logAuth('verification_failed', null, false, ip, new Error('Invalid or expired token'));
      return res.status(400).json({ 
        message: 'Invalid or expired verification token',
        details: 'The verification link may have expired or has already been used.'
      });
    }

    // Update user verification status
    await user.update({
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    });

    const duration = Date.now() - startTime;
    logger.logAuth('verification_success', user.email, true, ip);
    metrics.recordUserAction('emailVerifications');
    logger.info('Email verified successfully', { 
      email: user.email, 
      userId: user.id,
      duration: `${duration}ms` 
    });

    res.json({ 
      message: 'Email verified successfully',
      email: user.email 
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email verification error', { 
      token: token?.substring(0, 8) + '...', 
      duration: `${duration}ms`,
      error: error.message 
    });
    res.status(500).json({ 
      message: 'Email verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add resend verification route
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Resending verification email to:', email);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({
      verificationToken,
      verificationTokenExpires
    });

    emailService.sendVerificationEmail(email, verificationToken).catch(err => console.error('Email sending failed', err));
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// Add login route
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    logger.info('Login attempt', { email, ip });

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.logAuth('login_failed', email, false, ip, new Error('User not found'));
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      logger.logAuth('login_failed', email, false, ip, new Error('Email not verified'));
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.logAuth('login_failed', email, false, ip, new Error('Invalid password'));
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const duration = Date.now() - startTime;
    logger.logAuth('login_success', email, true, ip);
    metrics.recordUserAction('logins');
    logger.info('User login successful', { 
      email, 
      userId: user.id, 
      duration: `${duration}ms` 
    });

    // Send response
    res.json({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logAuth('login_error', email, false, ip, error);
    logger.error('Login error', { 
      email, 
      duration: `${duration}ms`,
      error: error.message 
    });
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

module.exports = router;