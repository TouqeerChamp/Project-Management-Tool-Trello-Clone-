const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id from token (check both possible field names for compatibility)
    const userId = decoded.userId || decoded.id;
    req.user = await User.findById(userId).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found, authorization denied',
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token, authorization denied',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, authorization denied',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

module.exports = authMiddleware;
