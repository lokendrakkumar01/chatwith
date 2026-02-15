const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   GET /api/messages/:userId
// @desc    Get conversation history with a specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
      try {
            const { userId } = req.params;
            const currentUserId = req.userId;

            // Pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            // Get messages between the two users
            const messages = await Message.find({
                  $or: [
                        { senderId: currentUserId, receiverId: userId },
                        { senderId: userId, receiverId: currentUserId }
                  ]
            })
                  .sort({ timestamp: -1 })
                  .skip(skip)
                  .limit(limit)
                  .populate('senderId', 'username profileImage')
                  .populate('receiverId', 'username profileImage');

            // Reverse to show oldest first
            messages.reverse();

            // Get total count for pagination
            const totalMessages = await Message.countDocuments({
                  $or: [
                        { senderId: currentUserId, receiverId: userId },
                        { senderId: userId, receiverId: currentUserId }
                  ]
            });

            res.json({
                  success: true,
                  messages,
                  pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalMessages / limit),
                        totalMessages,
                        hasMore: skip + messages.length < totalMessages
                  }
            });
      } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error fetching messages'
            });
      }
});

// @route   PATCH /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.patch('/:messageId/read', auth, async (req, res) => {
      try {
            const { messageId } = req.params;

            const message = await Message.findOneAndUpdate(
                  {
                        _id: messageId,
                        receiverId: req.userId
                  },
                  { status: 'read' },
                  { new: true }
            );

            if (!message) {
                  return res.status(404).json({
                        success: false,
                        message: 'Message not found'
                  });
            }

            res.json({
                  success: true,
                  message
            });
      } catch (error) {
            console.error('Mark read error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error updating message'
            });
      }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
      try {
            const unreadCount = await Message.countDocuments({
                  receiverId: req.userId,
                  status: { $ne: 'read' }
            });

            res.json({
                  success: true,
                  unreadCount
            });
      } catch (error) {
            console.error('Unread count error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error'
            });
      }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a specific message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
      try {
            const { messageId } = req.params;

            // Find message and verify ownership
            const message = await Message.findOne({
                  _id: messageId,
                  senderId: req.userId
            });

            if (!message) {
                  return res.status(404).json({
                        success: false,
                        message: 'Message not found or unauthorized'
                  });
            }

            // Delete the message
            await Message.findByIdAndDelete(messageId);

            res.json({
                  success: true,
                  message: 'Message deleted successfully',
                  messageId
            });
      } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error deleting message'
            });
      }
});

// @route   DELETE /api/messages/conversation/:userId
// @desc    Clear entire conversation with a user
// @access  Private
router.delete('/conversation/:userId', auth, async (req, res) => {
      try {
            const { userId } = req.params;
            const currentUserId = req.userId;

            // Delete all messages between the two users
            const result = await Message.deleteMany({
                  $or: [
                        { senderId: currentUserId, receiverId: userId },
                        { senderId: userId, receiverId: currentUserId }
                  ]
            });

            res.json({
                  success: true,
                  message: 'Conversation cleared successfully',
                  deletedCount: result.deletedCount
            });
      } catch (error) {
            console.error('Clear conversation error:', error);
            res.status(500).json({
                  success: false,
                  message: 'Server error clearing conversation'
            });
      }
});

module.exports = router;
