const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
      senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
      },
      receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
      },
      message: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [5000, 'Message cannot exceed 5000 characters']
      },
      timestamp: {
            type: Date,
            default: Date.now
      },
      status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
      }
});

// Compound indexes for optimized queries
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ timestamp: -1 });

// Index for efficient conversation queries
messageSchema.index({
      senderId: 1,
      receiverId: 1,
      timestamp: -1
});

module.exports = mongoose.model('Message', messageSchema);
