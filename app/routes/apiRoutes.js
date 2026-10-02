const express = require('express');
const router = express.Router();
const { register } = require('../middleware/metrics');
const db = require('../config/database');

// Endpoint xuất Metrics chuẩn cho Prometheus Scraper
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex.message);
  }
});

// Endpoint Health check kiểm tra trạng thái Container & MySQL
router.get('/health', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as is_alive');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: result[0].is_alive === 1 ? 'CONNECTED' : 'DISCONNECTED',
      uptime_seconds: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
