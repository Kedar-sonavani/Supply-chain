// middleware/auth.js - Role-based authentication middleware
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Basic authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await query('SELECT * FROM users WHERE id = ? AND is_active = true', [decoded.id]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Role-specific middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Convenience middleware for specific roles
const supplierOnly = authorize('supplier', 'admin');
const driverOnly = authorize('driver', 'admin');
const adminOnly = authorize('admin');
const consumerOnly = authorize('consumer', 'admin');

module.exports = {
  authenticate,
  authorize,
  supplierOnly,
  driverOnly,
  adminOnly,
  consumerOnly
};

// routes/shipments.js - Single route file handling all user types
const express = require('express');
const router = express.Router();
const { authenticate, supplierOnly, driverOnly, consumerOnly } = require('../middleware/auth');
const { query } = require('../config/database');

// All routes require authentication
router.use(authenticate);

// SUPPLIER ENDPOINTS
// Create new shipment (suppliers only)
router.post('/', supplierOnly, async (req, res) => {
  try {
    const {
      consumer_email,
      goods_description,
      origin_address,
      destination_address,
      pickup_date,
      expected_delivery_date
    } = req.body;

    // Find consumer by email
    const consumer = await query('SELECT id FROM users WHERE email = ? AND role = "consumer"', [consumer_email]);
    if (consumer.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }

    // Create shipment
    const result = await query(`
      INSERT INTO shipments (
        supplier_id, consumer_id, goods_description,
        origin_address, destination_address,
        pickup_date, expected_delivery_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'created')
    `, [
      req.user.id, consumer.rows[0].id, goods_description,
      origin_address, destination_address, pickup_date, expected_delivery_date
    ]);

    // Get the created shipment with tracking ID
    const shipment = await query('SELECT * FROM shipments WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      message: 'Shipment created successfully',
      shipment: shipment.rows[0]
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Get supplier's shipments
router.get('/my-shipments', supplierOnly, async (req, res) => {
  try {
    const shipments = await query(`
      SELECT 
        s.*,
        c.full_name as consumer_name,
        d.full_name as driver_name
      FROM shipments s
      LEFT JOIN users c ON s.consumer_id = c.id
      LEFT JOIN users d ON s.driver_id = d.id
      WHERE s.supplier_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json({ shipments: shipments.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// DRIVER ENDPOINTS
// Get assigned shipments (drivers only)
router.get('/assigned-to-me', driverOnly, async (req, res) => {
  try {
    const shipments = await query(`
      SELECT 
        s.*,
        sup.full_name as supplier_name,
        sup.company_name,
        c.full_name as consumer_name
      FROM shipments s
      LEFT JOIN users sup ON s.supplier_id = sup.id
      LEFT JOIN users c ON s.consumer_id = c.id
      WHERE s.driver_id = ?
        AND s.status NOT IN ('delivered', 'cancelled')
      ORDER BY s.pickup_date ASC
    `, [req.user.id]);

    res.json({ shipments: shipments.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned shipments' });
  }
});

// Update shipment status (drivers only)
router.patch('/:id/status', driverOnly, async (req, res) => {
  try {
    const { status, notes, latitude, longitude } = req.body;
    const shipmentId = req.params.id;

    // Verify driver is assigned to this shipment
    const shipment = await query('SELECT * FROM shipments WHERE id = ? AND driver_id = ?', [shipmentId, req.user.id]);
    if (shipment.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found or not assigned to you' });
    }

    // Update shipment status
    await query('UPDATE shipments SET status = ?, updated_at = NOW() WHERE id = ?', [status, shipmentId]);

    // Log status change with location
    await query(`
      INSERT INTO shipment_status_history (
        shipment_id, new_status, latitude, longitude, notes, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [shipmentId, status, latitude, longitude, notes, req.user.id]);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// CONSUMER ENDPOINTS
// Track shipment by tracking ID (consumers + public)
router.get('/track/:tracking_id', async (req, res) => {
  try {
    const { tracking_id } = req.params;
    
    const shipment = await query(`
      SELECT 
        s.*,
        sup.company_name as supplier_company,
        d.full_name as driver_name,
        d.phone as driver_phone
      FROM shipments s
      LEFT JOIN users sup ON s.supplier_id = sup.id
      LEFT JOIN users d ON s.driver_id = d.id
      WHERE s.tracking_id = ?
    `, [tracking_id]);

    if (shipment.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Get status history
    const history = await query(`
      SELECT 
        ssh.*,
        u.full_name as updated_by_name
      FROM shipment_status_history ssh
      LEFT JOIN users u ON ssh.updated_by = u.id
      WHERE ssh.shipment_id = ?
      ORDER BY ssh.created_at ASC
    `, [shipment.rows[0].id]);

    res.json({
      shipment: shipment.rows[0],
      history: history.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipment details' });
  }
});

// Get consumer's shipments
router.get('/my-orders', consumerOnly, async (req, res) => {
  try {
    const shipments = await query(`
      SELECT 
        s.*,
        sup.company_name as supplier_company,
        d.full_name as driver_name
      FROM shipments s
      LEFT JOIN users sup ON s.supplier_id = sup.id
      LEFT JOIN users d ON s.driver_id = d.id
      WHERE s.consumer_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json({ shipments: shipments.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ADMIN ENDPOINTS
// Get all shipments (admin only)
router.get('/all', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE s.status = ?';
      params.push(status);
    }
    
    const shipments = await query(`
      SELECT 
        s.*,
        sup.company_name as supplier_company,
        c.full_name as consumer_name,
        d.full_name as driver_name
      FROM shipments s
      LEFT JOIN users sup ON s.supplier_id = sup.id
      LEFT JOIN users c ON s.consumer_id = c.id
      LEFT JOIN users d ON s.driver_id = d.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM shipments s ${whereClause}`, params);
    
    res.json({
      shipments: shipments.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all shipments' });
  }
});

// Assign driver to shipment (admin only)
router.patch('/:id/assign-driver', adminOnly, async (req, res) => {
  try {
    const { driver_id } = req.body;
    const shipmentId = req.params.id;

    // Verify driver exists and is active
    const driver = await query('SELECT * FROM users WHERE id = ? AND role = "driver" AND is_active = true', [driver_id]);
    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found or inactive' });
    }

    await query('UPDATE shipments SET driver_id = ?, status = "assigned" WHERE id = ?', [driver_id, shipmentId]);
    
    res.json({ message: 'Driver assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

module.exports = router;