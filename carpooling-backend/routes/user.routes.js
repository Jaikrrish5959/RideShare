const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Enhanced validation middleware
const updateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Username can only contain letters and spaces'),
  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be exactly 10 digits')
];

// Update user settings
router.put('/settings', auth, updateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { username, phoneNumber } = req.body;
    const userId = req.user.userId;

    // Additional server-side validation
    if (username && username.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Username cannot be empty' 
      });
    }

    if (phoneNumber && phoneNumber.length !== 10) {
      return res.status(400).json({ 
        message: 'Phone number must be exactly 10 digits' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only provided fields
    if (username !== undefined) user.username = username.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    // Return updated user data (excluding sensitive information)
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ 
      message: 'Failed to update settings',
      error: error.message 
    });
  }
});

// Change password route
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;