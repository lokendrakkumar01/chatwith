const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

// Store active socket connections: userId -> socketId
const userSockets = new Map();

// Store typing status: conversationKey -> Set of userIds
const typingUsers = new Map();

const initializeSocket = (io) => {
      // Socket.io middleware for authentication
      io.use(async (socket, next) => {
            try {
                  const token = socket.handshake.auth.token;

                  if (!token) {
                        return next(new Error('Authentication token required'));
                  }

                  // Verify JWT token
                  const decoded = jwt.verify(token, process.env.JWT_SECRET);

                  // Find user
                  const user = await User.findById(decoded.userId);

                  if (!user) {
                        return next(new Error('User not found'));
                  }

                  // Attach user to socket
                  socket.userId = decoded.userId;
                  socket.username = user.username;
                  next();
            } catch (error) {
                  console.error('Socket authentication error:', error);
                  next(new Error('Authentication failed'));
            }
      });

      io.on('connection', async (socket) => {
            console.log(`User connected: ${socket.username} (${socket.userId})`);

            // Store socket mapping
            userSockets.set(socket.userId, socket.id);

            // Update user online status
            await User.findByIdAndUpdate(socket.userId, {
                  isOnline: true,
                  lastSeen: new Date()
            });

            // Broadcast user online status to all connected clients
            io.emit('user_status', {
                  userId: socket.userId,
                  isOnline: true
            });

            // Handle sending messages
            socket.on('send_message', async (data) => {
                  try {
                        const { receiverId, message } = data;

                        // Validate input
                        if (!receiverId || !message || !message.trim()) {
                              socket.emit('error', { message: 'Invalid message data' });
                              return;
                        }

                        // Create message in database
                        const newMessage = new Message({
                              senderId: socket.userId,
                              receiverId,
                              message: message.trim(),
                              status: 'sent'
                        });

                        await newMessage.save();

                        // Populate sender and receiver info
                        await newMessage.populate('senderId', 'username profileImage');
                        await newMessage.populate('receiverId', 'username profileImage');

                        // Send to sender (confirmation)
                        socket.emit('message_sent', {
                              messageId: newMessage._id,
                              senderId: newMessage.senderId,
                              receiverId: newMessage.receiverId,
                              message: newMessage.message,
                              timestamp: newMessage.timestamp,
                              status: newMessage.status
                        });

                        // Send to receiver if online
                        const receiverSocketId = userSockets.get(receiverId);
                        if (receiverSocketId) {
                              // Update status to delivered
                              newMessage.status = 'delivered';
                              await newMessage.save();

                              io.to(receiverSocketId).emit('receive_message', {
                                    messageId: newMessage._id,
                                    senderId: newMessage.senderId,
                                    receiverId: newMessage.receiverId,
                                    message: newMessage.message,
                                    timestamp: newMessage.timestamp,
                                    status: 'delivered'
                              });

                              // Notify sender about delivery
                              socket.emit('message_delivered', {
                                    messageId: newMessage._id,
                                    status: 'delivered'
                              });
                        }
                  } catch (error) {
                        console.error('Send message error:', error);
                        socket.emit('error', { message: 'Failed to send message' });
                  }
            });

            // Handle message read status
            socket.on('message_read', async (data) => {
                  try {
                        const { messageId, senderId } = data;

                        // Update message status
                        const message = await Message.findByIdAndUpdate(
                              messageId,
                              { status: 'read' },
                              { new: true }
                        );

                        if (message) {
                              // Notify sender about read status
                              const senderSocketId = userSockets.get(senderId);
                              if (senderSocketId) {
                                    io.to(senderSocketId).emit('message_status_update', {
                                          messageId,
                                          status: 'read'
                                    });
                              }
                        }
                  } catch (error) {
                        console.error('Message read error:', error);
                  }
            });

            // Handle typing indicator
            socket.on('typing', (data) => {
                  const { receiverId } = data;
                  const receiverSocketId = userSockets.get(receiverId);

                  if (receiverSocketId) {
                        io.to(receiverSocketId).emit('user_typing', {
                              userId: socket.userId,
                              username: socket.username
                        });
                  }
            });

            // Handle stop typing
            socket.on('stop_typing', (data) => {
                  const { receiverId } = data;
                  const receiverSocketId = userSockets.get(receiverId);

                  if (receiverSocketId) {
                        io.to(receiverSocketId).emit('user_stop_typing', {
                              userId: socket.userId
                        });
                  }
            });

            // Handle message deletion
            socket.on('delete_message', async (data) => {
                  try {
                        const { messageId, receiverId } = data;

                        // Verify ownership and delete
                        const message = await Message.findOneAndDelete({
                              _id: messageId,
                              senderId: socket.userId
                        });

                        if (message) {
                              // Notify sender
                              socket.emit('message_deleted', { messageId });

                              // Notify receiver if online
                              const receiverSocketId = userSockets.get(receiverId);
                              if (receiverSocketId) {
                                    io.to(receiverSocketId).emit('message_deleted', { messageId });
                              }
                        }
                  } catch (error) {
                        console.error('Delete message error:', error);
                        socket.emit('error', { message: 'Failed to delete message' });
                  }
            });

            // Handle conversation clearing
            socket.on('clear_conversation', async (data) => {
                  try {
                        const { userId } = data;

                        // Delete all messages between users
                        await Message.deleteMany({
                              $or: [
                                    { senderId: socket.userId, receiverId: userId },
                                    { senderId: userId, receiverId: socket.userId }
                              ]
                        });

                        // Notify sender
                        socket.emit('conversation_cleared', { userId });

                        // Notify other user if online
                        const otherUserSocketId = userSockets.get(userId);
                        if (otherUserSocketId) {
                              io.to(otherUserSocketId).emit('conversation_cleared', { userId: socket.userId });
                        }
                  } catch (error) {
                        console.error('Clear conversation error:', error);
                        socket.emit('error', { message: 'Failed to clear conversation' });
                  }
            });

            // Handle message sent (for file uploads via API)
            socket.on('message_sent', async (messageData) => {
                  try {
                        const receiverId = messageData.receiverId._id || messageData.receiverId;
                        const receiverSocketId = userSockets.get(receiverId);

                        if (receiverSocketId) {
                              // Update message status to delivered
                              await Message.findByIdAndUpdate(messageData._id, {
                                    status: 'delivered'
                              });

                              // Send to receiver
                              io.to(receiverSocketId).emit('receive_message', {
                                    ...messageData,
                                    status: 'delivered'
                              });

                              // Notify sender about delivery
                              socket.emit('message_delivered', {
                                    messageId: messageData._id,
                                    status: 'delivered'
                              });
                        }
                  } catch (error) {
                        console.error('Message sent broadcast error:', error);
                  }
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                  console.log(`User disconnected: ${socket.username} (${socket.userId})`);

                  // Remove from active sockets
                  userSockets.delete(socket.userId);

                  // Update user offline status
                  await User.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastSeen: new Date()
                  });

                  // Broadcast user offline status
                  io.emit('user_status', {
                        userId: socket.userId,
                        isOnline: false
                  });
            });

            // Handle errors
            socket.on('error', (error) => {
                  console.error('Socket error:', error);
            });
      });

      console.log('Socket.io initialized successfully');
};

module.exports = initializeSocket;
