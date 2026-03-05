const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const app = express();

// Import your routes
const authRoutes = require('./routes/auth');

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);

// Simple test
describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    console.log('Response:', res.body);
  });
});