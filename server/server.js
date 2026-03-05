const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables at the very top
dotenv.config();

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');
const app = express();

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.CLIENT_URL,
        process.env.VERCEL_URL || '', // Vercel deployment URL
        'http://localhost:5173' // Local development
      ].filter(url => url) // Remove empty strings
    : 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/boards', boardRoutes);
app.use('/lists', listRoutes);
app.use('/cards', cardRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

// Configure CORS for Socket.IO based on environment
const socketCorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.CLIENT_URL,
        process.env.VERCEL_URL || '', // Vercel deployment URL
        process.env.RENDER_EXTERNAL_URL || '', // Render deployment URL
        'http://localhost:5173' // Local development
      ].filter(url => url) // Remove empty strings
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
};

const io = socketIo(server, socketCorsOptions);

// Store connected users by board
const boardUsers = new Map();


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a board room
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);

    // Track user in board
    if (!boardUsers.has(boardId)) {
      boardUsers.set(boardId, new Set());
    }
    boardUsers.get(boardId).add(socket.id);

    // Emit updated user count to all users in the board
    io.to(boardId).emit('userJoined', {
      boardId,
      userCount: boardUsers.get(boardId).size
    });
  });

  // Leave a board room
  socket.on('leaveBoard', (boardId) => {
    socket.leave(boardId);

    // Remove user from board tracking
    if (boardUsers.has(boardId)) {
      boardUsers.get(boardId).delete(socket.id);

      // Emit updated user count to all users in the board
      io.to(boardId).emit('userLeft', {
        boardId,
        userCount: boardUsers.get(boardId).size
      });

      // Clean up empty board sets
      if (boardUsers.get(boardId).size === 0) {
        boardUsers.delete(boardId);
      }
    }
  });

  // Handle card movement
  socket.on('cardMoved', (data) => {
    const { boardId, cardId, sourceListId, destinationListId, sourceIndex, destinationIndex } = data;
    // Broadcast to all users in the same board except the sender
    socket.to(boardId).emit('cardMoved', data);
  });

  // Handle sending messages
  socket.on('sendMessage', (data) => {
    const { boardId, message, user } = data;
    // Broadcast to all users in the same board except the sender
    socket.to(boardId).emit('newMessage', { ...data, timestamp: new Date() });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from all board tracking
    for (const [boardId, users] of boardUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);

        // Emit updated user count
        io.to(boardId).emit('userLeft', {
          boardId,
          userCount: users.size
        });

        // Clean up empty board sets
        if (users.size === 0) {
          boardUsers.delete(boardId);
        }
      }
    }
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
  }
};

const PORT = process.env.PORT || 5000;

// Start server first then connect DB
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});