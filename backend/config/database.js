const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  // Remove invalid options: reconnect, acquireTimeout
  // idleTimeout: 300000, // Not needed for mysql2
};

// Connection pool
let pool = null;
let isConnected = false;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000,
};

// Sleep helper function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize connection pool with retry logic
const initializePool = async (retryCount = 0) => {
  try {
    if (!pool) {
      console.log(`🔄 Attempting to connect to database (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries + 1})`);
      pool = mysql.createPool(dbConfig);
      // Test the connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      isConnected = true;
      console.log('✅ Connected to MySQL database successfully');
    }
    return pool;
  } catch (err) {
    console.error(`❌ Database connection attempt ${retryCount + 1} failed:`, err.message);
    if (retryCount < RETRY_CONFIG.maxRetries) {
      console.log(`⏳ Retrying in ${RETRY_CONFIG.retryDelay / 1000} seconds...`);
      await sleep(RETRY_CONFIG.retryDelay);
      return initializePool(retryCount + 1);
    } else {
      console.error('💀 All connection attempts failed. Please check your database configuration.');
      throw err;
    }
  }
};

// Enhanced query function with connection recovery
const query = async (queryText, params = [], retryCount = 0) => {
  const start = Date.now();
  try {
    if (!pool || !isConnected) {
      await initializePool();
    }
    const [rows, fields] = await pool.execute(queryText, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Query executed:', { 
        query: queryText.substring(0, 50) + (queryText.length > 50 ? '...' : ''), 
        duration: duration + 'ms',
        rows: Array.isArray(rows) ? rows.length : 1 
      });
    }
    return {
      rows,
      fields,
      affectedRows: rows.affectedRows || 0,
      insertId: rows.insertId || null
    };
  } catch (err) {
    console.error('❌ Query error:', err.message);
    throw err;
  }
};

// Helper function to get raw connection (for transactions)
const getConnection = async () => {
  if (!pool) {
    await initializePool();
  }
  return await pool.getConnection();
};

// Graceful shutdown
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
    console.log('✅ Database connection pool closed');
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Initialize pool on startup
initializePool().catch(console.error);

module.exports = {
  mysql,
  pool,
  query,
  getConnection,
  initializePool,
  closePool,
  isConnected: () => isConnected
};