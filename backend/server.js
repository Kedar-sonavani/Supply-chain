const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many login attempts, please try again later.'
});

// Health check route
app.get('/', (req, res) => {
  res.send('API is running');
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route registration with debug logs
try {
  console.log('Registering /api/auth');
  app.use('/api/auth', authLimiter, require('./routes/auth'));

  console.log('Registering /api/users');
  app.use('/api/users', require('./routes/users'));

  console.log('Registering /api/shipments');
  app.use('/api/shipments', require('./routes/shipments'));

  console.log('Registering /api/gps');
  app.use('/api/gps', require('./routes/gps'));

  console.log('Registering /api/alerts');
  app.use('/api/alerts', require('./routes/alerts'));

  console.log('Registering /api/notifications');
  app.use('/api/notifications', require('./routes/notifications'));

  console.log('Registering /api/analytics');
  app.use('/api/analytics', require('./routes/analytics'));

} catch (error) {
  console.error('❌ Route loading error:', error.message);
  console.error(error); // Show full stack for debugging
  console.log('⚠️  Some routes may not be available. Create missing route files.');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});