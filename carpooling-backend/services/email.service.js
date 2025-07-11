const nodemailer = require('nodemailer');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
require('dotenv').config();

// Create reusable transporter with secure settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // TLS port
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Using App Password
  },
  tls: {
    rejectUnauthorized: true // Verify TLS/SSL certificate
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Add email queue to prevent overwhelming free SMTP service
const emailQueue = [];
const MAX_EMAILS_PER_MINUTE = 10;
let emailsSentInLastMinute = 0;

const processEmailQueue = async () => {
  if (emailQueue.length === 0 || emailsSentInLastMinute >= MAX_EMAILS_PER_MINUTE) {
    return;
  }

  const email = emailQueue.shift();
  try {
    await transporter.sendMail(email);
    emailsSentInLastMinute++;
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

// Reset counter every minute
setInterval(() => {
  emailsSentInLastMinute = 0;
}, 60000);

const emailService = {
  sendVerificationEmail: async (email, verificationToken) => {
    const startTime = Date.now();
    logger.info('Sending verification email', { email, operation: 'verification' });
    
    const verificationLink = `${process.env.FRONTEND_URL}/#/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"ShareRides" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - ShareRides',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Welcome to ShareRides!</h2>
          <p style="color: #666;">
            Thank you for registering. Please click the button below to verify your email address:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Verify Email
            </a>
          </div>
          <p style="color: #666;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationLink}">${verificationLink}</a>
          </p>
          <p style="color: #666;">
            This link will expire in 24 hours.
          </p>
        </div>
      `
    };

    try {
      emailQueue.push(mailOptions);
      await processEmailQueue();
      
      const duration = Date.now() - startTime;
      logger.logEmail('verification_email', email, true);
      metrics.recordEmail(true);
      logger.info('Verification email queued successfully', { 
        email, 
        duration: `${duration}ms` 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logEmail('verification_email', email, false, error);
      metrics.recordEmail(false);
      logger.error('Email sending error', {
        email,
        duration: `${duration}ms`,
        message: error.message,
        code: error.code,
        command: error.command
      });
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  },

  async retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn('Email retry attempt', { 
          attempt: i + 1, 
          maxRetries, 
          error: error.message 
        });
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  },

  sendRideRequestUpdate: async (userId, status, message) => {
    const startTime = Date.now();
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.email) {
        logger.warn('User not found for ride request update', { userId });
        return;
      }

      logger.info('Sending ride request update', { 
        userId, 
        email: user.email, 
        status, 
        operation: 'ride_request_update' 
      });

      await emailService.retryOperation(async () => {
        const mailOptions = {
          from: `"ShareRides" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Ride Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Ride Request Update</h2>
              <p style="color: #666;">
                ${message}
              </p>
              ${status === 'accepted' ? `
                <p style="color: #666;">
                  You can now view the driver's contact details in the app.
                </p>
              ` : `
                <p style="color: #666;">
                  Don't worry! You can search for other available trips.
                </p>
              `}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/#/search"
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                  View Available Trips
                </a>
              </div>
            </div>
          `
        };

        emailQueue.push(mailOptions);
        await processEmailQueue();
      });

      const duration = Date.now() - startTime;
      logger.logEmail('ride_request_update', user.email, true);
      metrics.recordEmail(true);
      logger.info('Ride request update email sent', { 
        userId, 
        email: user.email, 
        status, 
        duration: `${duration}ms` 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logEmail('ride_request_update', null, false, error);
      metrics.recordEmail(false);
      logger.error('Error sending ride request update email', { 
        userId, 
        status, 
        duration: `${duration}ms`,
        error: error.message 
      });
    }
  },

  sendTripUpdateNotification: async (userEmail, changes, trip) => {
    try {
      const mailOptions = {
        from: `"ShareRides" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Trip Details Updated',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Trip Update Notice</h2>
            <p style="color: #666;">
              The trip you're participating in has been updated:
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <pre style="margin: 0; white-space: pre-wrap;">${changes}</pre>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/#/my-trips"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                View My Trips
              </a>
            </div>
          </div>
        `
      };

      emailQueue.push(mailOptions);
      await processEmailQueue();
    } catch (error) {
      console.error('Error sending trip update notification:', error);
    }
  },

  sendTripCancellationNotification: async (userEmail, trip) => {
    try {
      const mailOptions = {
        from: `"ShareRides" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Trip Cancelled',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Trip Cancellation Notice</h2>
            <p style="color: #666;">
              Unfortunately, the trip has been cancelled by the driver.
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p><strong>Trip Details:</strong></p>
              <ul style="list-style: none; padding-left: 0;">
                <li>From: ${trip.start_point}</li>
                <li>To: ${trip.destination}</li>
                <li>Date: ${trip.date}</li>
                <li>Time: ${trip.time}</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/#/search"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Find Another Trip
              </a>
            </div>
          </div>
        `
      };

      emailQueue.push(mailOptions);
      await processEmailQueue();
      console.log('Trip cancellation email queued:', userEmail);
    } catch (error) {
      console.error('Error sending trip cancellation notification:', error);
    }
  },

  sendNewRideRequestNotification: async (driverEmail, request, trip) => {
    try {
      const mailOptions = {
        from: `"ShareRides" <${process.env.EMAIL_USER}>`,
        to: driverEmail,
        subject: 'New Ride Request',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">New Ride Request</h2>
            <p style="color: #666;">
              Someone has requested to join your trip!
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p><strong>Trip Details:</strong></p>
              <ul style="list-style: none; padding-left: 0;">
                <li>From: ${trip.start_point}</li>
                <li>To: ${trip.destination}</li>
                <li>Date: ${trip.date}</li>
                <li>Time: ${trip.time}</li>
              </ul>
              <p><strong>Request Details:</strong></p>
              <ul style="list-style: none; padding-left: 0;">
                <li>Requester: ${request.requester?.username || request.requester?.email}</li>
                <li>Message: ${request.message || 'No message provided'}</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/#/ride-requests"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                View Request
              </a>
            </div>
          </div>
        `
      };

      emailQueue.push(mailOptions);
      await processEmailQueue();
      console.log('New ride request notification queued:', driverEmail);
    } catch (error) {
      console.error('Error sending new ride request notification:', error);
    }
  }
};

module.exports = emailService;