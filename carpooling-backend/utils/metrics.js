const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        errors: 0
      },
      users: {
        registrations: 0,
        logins: 0,
        emailVerifications: 0
      },
      trips: {
        created: 0,
        updated: 0,
        deleted: 0
      },
      rideRequests: {
        created: 0,
        accepted: 0,
        rejected: 0
      },
      emails: {
        sent: 0,
        failed: 0
      },
      database: {
        queries: 0,
        errors: 0,
        slowQueries: 0
      }
    };

    // Reset metrics daily
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  // HTTP Request metrics
  recordRequest(method, statusCode) {
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    
    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }
  }

  // User action metrics
  recordUserAction(action) {
    if (this.metrics.users[action] !== undefined) {
      this.metrics.users[action]++;
    }
  }

  // Trip metrics
  recordTripAction(action) {
    if (this.metrics.trips[action] !== undefined) {
      this.metrics.trips[action]++;
    }
  }

  // Ride request metrics
  recordRideRequestAction(action) {
    if (this.metrics.rideRequests[action] !== undefined) {
      this.metrics.rideRequests[action]++;
    }
  }

  // Email metrics
  recordEmail(success) {
    if (success) {
      this.metrics.emails.sent++;
    } else {
      this.metrics.emails.failed++;
    }
  }

  // Database metrics
  recordDatabaseQuery(duration, error = false) {
    this.metrics.database.queries++;
    
    if (error) {
      this.metrics.database.errors++;
    }
    
    if (duration > 1000) { // Slow query threshold: 1 second
      this.metrics.database.slowQueries++;
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  // Reset daily metrics (keep cumulative data)
  resetDailyMetrics() {
    logger.info('Daily Metrics Summary', this.getMetrics());
    
    // Reset counters that should be daily
    this.metrics.requests = {
      total: 0,
      byMethod: {},
      byStatus: {},
      errors: 0
    };
  }

  // Log metrics summary
  logSummary() {
    const summary = this.getMetrics();
    logger.info('Metrics Summary', summary);
    return summary;
  }
}

// Singleton instance
const metrics = new MetricsCollector();

module.exports = metrics;
