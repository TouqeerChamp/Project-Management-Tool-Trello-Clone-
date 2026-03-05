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
    ? [process.env.CLIENT_URL, 'http://localhost:5173'] // Add your Vercel URL to CLIENT_URL in production
    : 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.CLIENT_URL, 'http://localhost:5173'] // Add your Vercel URL to CLIENT_URL in production
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users by board
const boardUsers = new Map();

// Socket.IO connection handling
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
    console.log('🚀 Connecting to LOCAL MongoDB...');
    // Local ke liye kisi extra options (family, timeout) ki zaroorat nahi
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ BOOM! Local MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ Local Connection Failed:', err.message);
  }
};

const PORT = process.env.PORT || 5000;

// Start server first then connect DB
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});