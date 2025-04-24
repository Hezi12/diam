const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// נתיב להתחברות
router.post('/login', authController.login);

// נתיב לקבלת פרטי המשתמש הנוכחי (עם אימות)
router.get('/me', auth, authController.getCurrentUser);

// יצירת משתמש מנהל ראשוני
authController.initializeAdmin();

module.exports = router; 