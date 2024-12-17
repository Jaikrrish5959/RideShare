const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add the signup route if it's missing
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Received signup request for:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
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
      isVerified: false
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add email verification route
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    console.log('Verifying email with token:', token);

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

    console.log('Found user:', user ? {
      email: user.email,
      tokenExpires: user.verificationTokenExpires,
      currentTime: new Date()
    } : 'No user found');

    if (!user) {
      console.log('Invalid or expired verification token');
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

    console.log('Email verified successfully for:', user.email);
    res.json({ 
      message: 'Email verified successfully',
      email: user.email 
    });
  } catch (error) {
    console.error('Email verification error:', error);
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

    await emailService.sendVerificationEmail(email, verificationToken);
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// Add login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

module.exports = router; 