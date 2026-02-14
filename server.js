require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const messageUploadRoutes = require('./routes/messageUpload');
const profileRoutes = require('./routes/profile');

// Import socket handler
const initializeSocket = require('./socket/socketHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
      cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
      }
});

// Middleware
app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
});

app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
})
      .then(() => {
            console.log('✅ MongoDB connected successfully');
      })
      .catch((error) => {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
      });

// Initialize Socket.io handlers
initializeSocket(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageUploadRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
      res.json({
            success: true,
            message: 'ChatWith server is running',
            timestamp: new Date()
      });
});

// Serve index.html for root route
app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve chat.html for chat route
app.get('/chat', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// 404 handler
app.use((req, res) => {
      res.status(404).json({
            success: false,
            message: 'Route not found'
      });
});

// Error handling middleware
app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({
            success: false,
            message: 'Internal server error'
      });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
      console.log(`\n🚀 ChatWith server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access at: http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing server gracefully');
      server.close(() => {
            mongoose.connection.close(false, () => {
                  console.log('MongoDB connection closed');
                  process.exit(0);
            });
      });
});
