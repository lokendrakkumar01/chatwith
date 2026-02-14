const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Validation rules
const signupValidation = [
      body('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be 3-30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
      body('email')
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),
      body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
      body('email')
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),
      body('password')
            .notEmpty()
            .withMessage('Password is required')
];

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', signupValidation, async (req, res) => {
      try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({
                        success: false,
                        errors: errors.array()
                  });
            }

            const { username, email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                  $or: [{ email }, { username }]
            });

            if (existingUser) {
                  if (existingUser.email === email) {
                        return res.status(400).json({
                              success: false,
                              message: 'Email already registered'
                        });
                  }
                  if (existingUser.username === username) {
                        return res.status(400).json({
                              success: false,
                              message: 'Username already taken'
                        });
                  }
            }

            // Create new user
            const user = new User({
                  username,
                  email,
                  password
            });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                  { userId: user._id },
                  process.env.JWT_SECRET,
                  { expiresIn: '7d' }
            );

            res.status(201).json({
                  success: true,
                  message: 'User registered successfully',
                  token,
                  user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage
                  }
            });
      } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error during signup'
            });
      }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
      try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                  return res.status(400).json({
                        success: false,
                        errors: errors.array()
                  });
            }

            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({ email });

            if (!user) {
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                  });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                  });
            }

            // Generate JWT token
            const token = jwt.sign(
                  { userId: user._id },
                  process.env.JWT_SECRET,
                  { expiresIn: '7d' }
            );

            res.json({
                  success: true,
                  message: 'Login successful',
                  token,
                  user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage
                  }
            });
      } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error during login'
            });
      }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
      try {
            res.json({
                  success: true,
                  user: req.user
            });
      } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

// @route   GET /api/auth/users
// @desc    Get all users (for user list)
// @access  Private
router.get('/users', auth, async (req, res) => {
      try {
            const users = await User.find({ _id: { $ne: req.userId } })
                  .select('-password')
                  .sort({ username: 1 });

            res.json({
                  success: true,
                  users
            });
      } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

module.exports = router;
