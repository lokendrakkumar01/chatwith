const express = require('express');
const router = express.Router();
const { uploadImage } = require('../config/multer');
const { uploadProfileImage } = require('../config/cloudinary');
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

            // Upload to Cloudinary
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
                  message: 'Failed to upload profile image'
            });
      }
});

module.exports = router;
