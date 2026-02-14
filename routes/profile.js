const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', auth, async (req, res) => {
      try {
            const user = await User.findById(req.userId).select('-password');

            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: 'User not found'
                  });
            }

            res.json({
                  success: true,
                  user
            });
      } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', [
      auth,
      body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be 3-30 characters'),
      body('bio')
            .optional()
            .trim()
            .isLength({ max: 150 })
            .withMessage('Bio cannot exceed 150 characters')
], async (req, res) => {
      try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({
                        success: false,
                        errors: errors.array()
                  });
            }

            const { username, bio } = req.body;
            const updateData = {};

            if (username) {
                  // Check if username already exists
                  const existingUser = await User.findOne({
                        username,
                        _id: { $ne: req.userId }
                  });

                  if (existingUser) {
                        return res.status(400).json({
                              success: false,
                              message: 'Username already taken'
                        });
                  }
                  updateData.username = username;
            }

            if (bio !== undefined) {
                  updateData.bio = bio;
            }

            const user = await User.findByIdAndUpdate(
                  req.userId,
                  updateData,
                  { new: true }
            ).select('-password');

            res.json({
                  success: true,
                  message: 'Profile updated successfully',
                  user
            });
      } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

// @route   PUT /api/profile/password
// @desc    Change password
// @access  Private
router.put('/password', [
      auth,
      body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
      body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters')
], async (req, res) => {
      try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({
                        success: false,
                        errors: errors.array()
                  });
            }

            const { currentPassword, newPassword } = req.body;

            const user = await User.findById(req.userId);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);

            if (!isMatch) {
                  return res.status(400).json({
                        success: false,
                        message: 'Current password is incorrect'
                  });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                  success: true,
                  message: 'Password changed successfully'
            });
      } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

// @route   DELETE /api/profile
// @desc    Delete user account
// @access  Private
router.delete('/', auth, async (req, res) => {
      try {
            await User.findByIdAndDelete(req.userId);

            res.json({
                  success: true,
                  message: 'Account deleted successfully'
            });
      } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

module.exports = router;
