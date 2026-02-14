const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../config/multer');
const { uploadMessageMedia } = require('../config/cloudinary');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   POST /api/messages/upload
// @desc    Send message with file attachment
// @access  Private
router.post('/upload', auth, uploadMedia.single('file'), async (req, res) => {
      try {
            const { receiverId, message } = req.body;

            if (!req.file && !message) {
                  return res.status(400).json({
                        success: false,
                        message: 'Either file or message text is required'
                  });
            }

            let mediaData = null;

            // Upload file to Cloudinary if present
            if (req.file) {
                  const resourceType = req.file.mimetype.startsWith('image/') ? 'image' :
                        req.file.mimetype.startsWith('video/') ? 'video' : 'raw';

                  const uploadResult = await uploadMessageMedia(req.file.buffer, resourceType);

                  mediaData = {
                        url: uploadResult.url,
                        type: resourceType,
                        fileName: req.file.originalname,
                        fileSize: req.file.size
                  };
            }

            // Create message
            const newMessage = new Message({
                  senderId: req.userId,
                  receiverId,
                  message: message || '',
                  media: mediaData,
                  status: 'sent'
            });

            await newMessage.save();

            // Populate sender and receiver
            await newMessage.populate('senderId', 'username profileImage');
            await newMessage.populate('receiverId', 'username profileImage');

            res.json({
                  success: true,
                  message: 'Message sent successfully',
                  data: newMessage
            });
      } catch (error) {
            console.error('Message upload error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Failed to send message'
            });
      }
});

module.exports = router;
