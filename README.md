# ChatWith - Real-Time Messaging Platform 💬

A production-ready, secure, and scalable real-time messaging application built with Node.js, Socket.io, and MongoDB.

![ChatWith](https://img.shields.io/badge/status-production--ready-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-v18+-blue)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green)
![Socket.io](https://img.shields.io/badge/socket.io-v4.6-purple)

---

## ✨ Features

### 🔐 **Security**
- JWT-based authentication
- bcrypt password hashing
- Rate limiting (100 req/15min)
- Input validation & sanitization
- Protected WebSocket connections

### ⚡ **Real-Time**
- Instant message delivery via WebSockets
- Typing indicators
- Read receipts (sent/delivered/read)
- Online/offline status
- Auto-reconnection

### 💬 **Messaging**
- One-to-one private chats
- Message history with pagination
- User search
- Message timestamps
- Profile avatars

### 🎨 **Modern UI**
- Glassmorphism design
- Smooth animations
- Dark theme
- Responsive layout
- Beautiful gradients

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone or navigate to the project:**
```bash
cd c:\Users\loken\Downloads\chatwith
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
The `.env` file is already configured with your MongoDB credentials.

4. **Start the server:**
```bash
npm start
```

5. **Access the application:**
```
http://localhost:5000
```

---

## 📖 Usage

### Creating an Account

1. Open `http://localhost:5000` in your browser
2. Click **"Sign up"**
3. Enter username, email, and password
4. Click **"Sign Up"** button

### Starting a Chat

1. After login, you'll see the user list on the left
2. Click on any user to open a conversation
3. Type your message and press Enter or click send

### Testing Real-Time Features

**Option 1:** Open two browser windows
- Regular window: Login as User A
- Incognito window: Login as User B
- Start chatting between them

**Option 2:** Use two different browsers
- Chrome: Login as User A
- Firefox: Login as User B
- Chat in real-time

---

## 🏗️ Architecture

### Backend Structure
```
├── models/
│   ├── User.js              # User schema
│   └── Message.js           # Message schema
├── routes/
│   ├── auth.js              # Authentication routes
│   └── messages.js          # Message routes
├── middleware/
│   └── auth.js              # JWT middleware
├── socket/
│   └── socketHandler.js     # Socket.io events
└── server.js                # Main server
```

### Frontend Structure
```
├── public/
│   ├── index.html           # Auth page
│   ├── chat.html            # Chat interface
│   ├── css/
│   │   └── style.css        # Styling
│   └── js/
│       ├── auth.js          # Auth logic
│       └── chat.js          # Chat logic
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/users` - Get all users (protected)

### Messages
- `GET /api/messages/:userId` - Get conversation history (protected)
- `PATCH /api/messages/:messageId/read` - Mark as read (protected)

### Health
- `GET /api/health` - Server health check

---

## 🔧 Technology Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Real-time** | Socket.io |
| **Database** | MongoDB (Atlas) |
| **Authentication** | JWT + bcrypt |
| **Validation** | express-validator |
| **Security** | express-rate-limit, CORS |

---

## 🛡️ Security Features

✅ JWT token authentication (7-day expiry)  
✅ Password hashing with bcrypt  
✅ Rate limiting on API endpoints  
✅ Input validation & sanitization  
✅ XSS attack prevention  
✅ CORS configuration  
✅ Environment variable protection  
✅ Socket authentication  

---

## 📊 Database Schema

### User Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  profileImage: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date
}
```

### Message Collection
```javascript
{
  senderId: ObjectId,
  receiverId: ObjectId,
  message: String,
  timestamp: Date,
  status: 'sent' | 'delivered' | 'read'
}
```

**Indexes:**
- Compound: `(senderId, receiverId, timestamp)`
- Single: `senderId`, `receiverId`, `timestamp`

---

## 🎯 Real-Time Events

### Client → Server
- `send_message` - Send a new message
- `message_read` - Mark message as read
- `typing` - User is typing
- `stop_typing` - User stopped typing

### Server → Client
- `receive_message` - New message received
- `message_sent` - Message sent confirmation
- `message_delivered` - Message delivered
- `message_status_update` - Status changed
- `user_status` - User online/offline
- `user_typing` - User typing indicator
- `user_stop_typing` - Stop typing

---

## 🚀 Future Enhancements

The platform is designed for easy expansion:

- [ ] Group chats
- [ ] Media file sharing (images, videos)
- [ ] Voice messages
- [ ] Video calls (WebRTC)
- [ ] End-to-end encryption
- [ ] Push notifications
- [ ] Message reactions
- [ ] Message edit/delete
- [ ] Message search
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Cloud storage integration

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 5000 is available
- Verify MongoDB connection string in `.env`
- Ensure all dependencies are installed

### Can't connect to database
- Check internet connection
- Verify MongoDB credentials
- Ensure database user has read/write permissions

### Messages not sending
- Check browser console for errors
- Verify Socket.io connection
- Ensure JWT token is valid

---

## 📝 Environment Variables

Required variables in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5000
```

---

## 👨‍💻 Development

### Development Mode (auto-restart)
```bash
npm run dev
```

### Production Build
```bash
NODE_ENV=production npm start
```

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the walkthrough documentation
3. Check server logs for errors

---

## ✅ Status

**Current Status:** ✅ Production Ready

- ✅ All core features implemented
- ✅ Security measures in place
- ✅ Real-time communication working
- ✅ Database optimized with indexes
- ✅ Modern UI with animations
- ✅ Comprehensive error handling
- ✅ Ready for deployment

---

## 🎉 Acknowledgments

Built with modern web technologies and best practices for security, scalability, and user experience.

**Server running at:** http://localhost:5000

**Enjoy chatting!** 💬
