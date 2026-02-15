const express = require('express');
const router = express.Router();
const { uploadImage } = require('../config/multer');
// Use local storage instead of Cloudinary
const { uploadProfileImage } = require('../config/localStorage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/upload/profile
// @desc    Upload profile image
// @access  Private
router.post('/profile', auth, uploadImage.single('profileImage'), async (req, res) => {
      try {
            if (!req.file) {
                  return res.status(400).json({
                        success: false,
                        message: 'No image file provided'
                  });
            }

            // Upload to local storage
            const imageUrl = await uploadProfileImage(req.file.buffer);

            // Update user profile image
            const user = await User.findByIdAndUpdate(
                  req.userId,
                  { profileImage: imageUrl },
                  { new: true }
            ).select('-password');

            res.json({
                  success: true,
                  message: 'Profile image uploaded successfully',
                  profileImage: imageUrl,
                  user
            });
      } catch (error) {
            console.error('Profile upload error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Failed to upload profile image',
                  error: error.message
            });
      }
});

module.exports = router;
