const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const auth = (req, res, next) => {
  const startTime = Date.now();
  const authHeader = req.headers.authorization;
  const ip = req.ip || req.connection.remoteAddress;

  if (!authHeader) {
    logger.logAuth('missing_token', null, false, ip);
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.logAuth('invalid_header', null, false, ip);
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    const duration = Date.now() - startTime;
    logger.logAuth('token_verified', decoded.email, true, ip);
    logger.debug('Token verification duration', { duration: `${duration}ms` });
    
    next();
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logAuth('token_invalid', null, false, ip, error);
    logger.debug('Token verification duration', { duration: `${duration}ms`, error: true });
    
    return res.status(401).json({ message: 'Authentication required' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.logAuth('admin_access_denied', req.user?.email, false, req.ip);
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

module.exports = { auth, isAdmin };