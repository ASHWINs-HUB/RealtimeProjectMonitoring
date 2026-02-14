const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register user
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password || !role) {
    throw new ValidationError('All fields are required');
  }

  if (!['hr', 'manager', 'team_leader', 'developer'].includes(role)) {
    throw new ValidationError('Invalid role');
  }

  // Check if user exists
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    throw new ValidationError('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await db('users').insert({
    name,
    email,
    password: hashedPassword,
    role
  }).returning('*');

  // Generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Remove password from response
  delete user.password;

  res.status(201).json({
    message: 'User created successfully',
    user,
    token
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user
  const user = await db('users').where({ email, is_active: true }).first();
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last login
  await db('users').where({ id: user.id }).update({
    last_login: new Date()
  });

  // Generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Remove password from response
  delete user.password;

  res.json({
    message: 'Login successful',
    user,
    token
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    user: req.user
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    message: 'Token refreshed',
    token
  });
}));

module.exports = router;
