const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const prisma = require('./config/db');

// Initialize express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ROMS API is running!' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join restaurant room
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant_${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Test DB connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully!'))
  .catch((err) => console.error('❌ Database connection failed:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 ROMS Server running on port ${PORT}`);
});

module.exports = { app, io };