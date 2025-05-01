const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const protect = require('../middleware/auth');

/**
 * נתיבי API להכנסות
 */

// קבלת נתוני הכנסות חודשיים מלאים
router.get('/monthly/:site/:year/:month', protect, revenueController.getMonthlyRevenue);

module.exports = router; 