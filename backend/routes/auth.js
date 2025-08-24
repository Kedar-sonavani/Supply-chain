const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateToken, authorizeRoles } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, address } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['email', 'password', 'name', 'role']
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role,
      phone: phone || null,
      address: address || null
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Remove password from response
    delete user.password;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      phone: req.user.phone,
      address: req.user.address,
      is_active: req.user.is_active,
      created_at: req.user.created_at
    }
  });
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const updatedUser = await User.update(req.user.id, {
      name: name || req.user.name,
      phone: phone || req.user.phone,
      address: address || req.user.address
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// Admin only - Get user statistics
router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await User.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Test protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user.email,
    role: req.user.role,
    timestamp: new Date().toISOString()
  });
});

// Test admin route
router.get('/admin-only', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
