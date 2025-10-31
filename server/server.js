// Main server file
const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

// Import configurations and utilities
const pool = require('./config/database');
const { client: redisClient } = require('./config/redis');
const { initializeDatabase, checkDatabaseStatus } = require('./database/init');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression()); // Response compression for better performance
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Database and server initialization
async function startServer() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connection successful');
    
    // Check if database tables exist
    const existingTables = await checkDatabaseStatus();
    if (existingTables.length === 0) {
      console.log('No tables found. Initializing database...');
      await initializeDatabase();
    } else {
      console.log('✓ Database tables found:', existingTables.join(', '));
    }
    
    // Test Redis connection (optional - server will work without Redis)
    try {
      await redisClient.ping();
      console.log('✓ Redis connection successful');
    } catch (redisError) {
      console.warn('⚠ Redis connection failed. Caching will be disabled.');
      console.warn('Redis error:', redisError.message);
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  
  try {
    await pool.end();
    console.log('✓ Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  try {
    await redisClient.quit();
    console.log('✓ Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

// Start the server (only in development)
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export the app for Vercel
module.exports = app;