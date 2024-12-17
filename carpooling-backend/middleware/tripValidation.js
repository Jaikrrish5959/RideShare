const { body } = require('express-validator');

const tripValidation = [
  body('start_point')
    .trim()
    .notEmpty()
    .withMessage('Start point is required'),
  
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  
  body('seats_available')
    .isInt({ min: 0 })
    .withMessage('Available seats must be a non-negative number')
    .toInt()
];

module.exports = { tripValidation }; 