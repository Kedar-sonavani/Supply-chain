const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Update GPS location (Drivers only)
router.post('/update', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const { shipmentId, latitude, longitude, heading, speed, accuracy } = req.body;
    const driverId = req.user.id;

    // Validate required fields
    if (!shipmentId || !latitude || !longitude) {
      return res.status(400).json({
        message: 'shipmentId, latitude, and longitude are required'
      });
    }

    // Insert GPS tracking data
    const result = await query(`
      INSERT INTO gps_tracking 
      (shipment_id, driver_id, latitude, longitude, accuracy, speed, heading, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      shipmentId,
      driverId,
      latitude,
      longitude,
      accuracy || null,
      speed || null,
      heading || null
    ]);

    // Update shipment status to 'in_transit' if not already
    await query(`
      UPDATE shipments 
      SET status = 'in_transit', updated_at = NOW() 
      WHERE id = ? AND status IN ('assigned', 'picked_up')
    `, [shipmentId]);

    res.json({
      message: 'Location updated successfully',
      trackingId: result.insertId
    });

  } catch (error) {
    console.error('GPS update error:', error);
    res.status(500).json({
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// Get GPS history for a shipment
router.get('/shipment/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { limit = 50 } = req.query;

    const { rows } = await query(`
      SELECT 
        gt.*,
        u.name as driver_name
      FROM gps_tracking gt
      LEFT JOIN users u ON gt.driver_id = u.id
      WHERE gt.shipment_id = ?
      ORDER BY gt.timestamp DESC
      LIMIT ?
    `, [shipmentId, parseInt(limit)]);

    res.json({
      shipmentId,
      gpsHistory: rows.reverse(), // Return in chronological order
      totalPoints: rows.length
    });

  } catch (error) {
    console.error('GPS history error:', error);
    res.status(500).json({
      message: 'Failed to fetch GPS history',
      error: error.message
    });
  }
});

// Get current location of a shipment
router.get('/shipment/:shipmentId/current', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const { rows } = await query(`
      SELECT 
        gt.*,
        u.name as driver_name,
        s.status as shipment_status
      FROM gps_tracking gt
      LEFT JOIN users u ON gt.driver_id = u.id
      LEFT JOIN shipments s ON gt.shipment_id = s.id
      WHERE gt.shipment_id = ?
      ORDER BY gt.timestamp DESC
      LIMIT 1
    `, [shipmentId]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'No GPS data found for this shipment'
      });
    }

    res.json({
      currentLocation: rows[0],
      lastUpdated: rows[0].timestamp
    });

  } catch (error) {
    console.error('Current location error:', error);
    res.status(500).json({
      message: 'Failed to fetch current location',
      error: error.message
    });
  }
});

// Get live tracking data for multiple shipments (Admin/Supplier)
router.get('/live', authenticateToken, authorizeRoles('admin', 'supplier'), async (req, res) => {
  try {
    const { supplierId } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'supplier') {
      whereClause = 'WHERE s.supplier_id = ?';
      params.push(req.user.id);
    } else if (supplierId) {
      whereClause = 'WHERE s.supplier_id = ?';
      params.push(supplierId);
    }

    const { rows } = await query(`
      SELECT 
        s.id as shipment_id,
        s.tracking_code,
        s.status,
        s.goods_description,
        gt.latitude,
        gt.longitude,
        gt.speed,
        gt.heading,
        gt.timestamp,
        u.name as driver_name,
        sup.name as supplier_name
      FROM shipments s
      LEFT JOIN (
        SELECT DISTINCT shipment_id,
               FIRST_VALUE(latitude) OVER (PARTITION BY shipment_id ORDER BY timestamp DESC) as latitude,
               FIRST_VALUE(longitude) OVER (PARTITION BY shipment_id ORDER BY timestamp DESC) as longitude,
               FIRST_VALUE(speed) OVER (PARTITION BY shipment_id ORDER BY timestamp DESC) as speed,
               FIRST_VALUE(heading) OVER (PARTITION BY shipment_id ORDER BY timestamp DESC) as heading,
               FIRST_VALUE(timestamp) OVER (PARTITION BY shipment_id ORDER BY timestamp DESC) as timestamp
        FROM gps_tracking
      ) gt ON s.id = gt.shipment_id
      LEFT JOIN users u ON s.driver_id = u.id
      LEFT JOIN users sup ON s.supplier_id = sup.id
      ${whereClause}
      AND s.status IN ('assigned', 'picked_up', 'in_transit', 'out_for_delivery')
      ORDER BY gt.timestamp DESC
    `, params);

    res.json({
      liveShipments: rows,
      totalActive: rows.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Live tracking error:', error);
    res.status(500).json({
      message: 'Failed to fetch live tracking data',
      error: error.message
    });
  }
});

module.exports = router;
