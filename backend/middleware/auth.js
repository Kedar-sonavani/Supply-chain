const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        error: 'INVALID_USER'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        error: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    
    next();
  };
};

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Verify token without middleware (for utility functions)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  generateToken,
  verifyToken
};