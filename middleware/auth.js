const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
      try {
            // Get token from header
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                  return res.status(401).json({
                        success: false,
                        message: 'No authentication token, access denied'
                  });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                  return res.status(401).json({
                        success: false,
                        message: 'User not found, token invalid'
                  });
            }

            // Attach user to request
            req.user = user;
            req.userId = decoded.userId;
            next();
      } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid token'
                  });
            }
            if (error.name === 'TokenExpiredError') {
                  return res.status(401).json({
                        success: false,
                        message: 'Token expired'
                  });
            }
            res.status(500).json({
                  success: false,
                  message: 'Server error during authentication'
            });
      }
};

module.exports = auth;
