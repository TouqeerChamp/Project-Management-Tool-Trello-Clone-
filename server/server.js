const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// CORS configuration - declared only once
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ extended: false }));

// Connect to MongoDB
connectDB();

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Simple root route for testing
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Socket.IO setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

// Track board rooms
const boardRooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a board room
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);
    
    // Track user count per board
    if (!boardRooms.has(boardId)) {
      boardRooms.set(boardId, new Set());
    }
    boardRooms.get(boardId).add(socket.id);
    
    const userCount = boardRooms.get(boardId).size;
    console.log(`User ${socket.id} joined board ${boardId}. Total users: ${userCount}`);
    
    // Notify others in the board
    socket.to(boardId).emit('userJoined', { boardId, userCount });
  });

  // Leave a board room
  socket.on('leaveBoard', (boardId) => {
    socket.leave(boardId);
    
    if (boardRooms.has(boardId)) {
      boardRooms.get(boardId).delete(socket.id);
      const userCount = boardRooms.get(boardId).size;
      console.log(`User ${socket.id} left board ${boardId}. Total users: ${userCount}`);
      
      // Notify others in the board
      io.to(boardId).emit('userLeft', { boardId, userCount });
      
      // Clean up empty rooms
      if (boardRooms.get(boardId).size === 0) {
        boardRooms.delete(boardId);
      }
    }
  });

  // Handle card move events
  socket.on('cardMoved', (data) => {
    console.log('Card moved:', data);
    // Broadcast to all other users in the same board
    socket.to(data.boardId).emit('cardMoved', data);
  });

  // Handle chat messages
  socket.on('sendMessage', (data) => {
    console.log('Message sent:', data);
    // Broadcast to ALL users in the board (including sender)
    io.to(data.boardId).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from all board rooms
    boardRooms.forEach((users, boardId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(boardId).emit('userLeft', { boardId, userCount: users.size });
        if (users.size === 0) {
          boardRooms.delete(boardId);
        }
      }
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});