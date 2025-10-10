const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');

// @desc    Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);
      if (!secret) {
        throw new Error('JWT secret not configured');
      }
      const decoded = jwt.verify(token, secret);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      // Merge role claims from token if present (useful for RBAC tests and external IdPs)
      if (decoded && typeof decoded === 'object') {
        if (decoded.role && !req.user?.role) {
          req.user = req.user || { id: decoded.id };
          req.user.role = decoded.role;
        }
        if (decoded.roles && !req.user?.roles) {
          req.user = req.user || { id: decoded.id };
          req.user.roles = decoded.roles;
        }
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

// @desc    Admin middleware - check if user is admin
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
});

// @desc    Optional auth - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);
      if (!secret) {
        // Continue unauthenticated if secret missing
        return next();
      }
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = null;
    }
  }

  next();
});

module.exports = {
  protect,
  admin,
  optionalAuth
};
