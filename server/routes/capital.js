const express = require('express');
const router = express.Router();
const capitalController = require('../controllers/capitalController');
const authMiddleware = require('../middleware/authMiddleware');

// נתיבים לניהול הון
// כל הנתיבים מוגנים עם middleware אבטחה למעט קריאות קבלת מידע בסיסיות

// קבלת נתוני הון
router.get('/', authMiddleware.verifyToken, capitalController.getCapitalData);

// קבלת מידע פיננסי מלא
router.get('/full', authMiddleware.verifyToken, capitalController.getFullFinancialData);

// עדכון סכום התחלתי
router.post('/initial', authMiddleware.verifyToken, capitalController.updateInitialAmount);

// קבלת היסטוריית עדכונים
router.get('/history', authMiddleware.verifyToken, capitalController.getCapitalHistory);

// סנכרון נתוני הון עם הכנסות והוצאות של חודש מסוים
router.post('/sync/monthly/:year/:month', authMiddleware.verifyToken, capitalController.syncMonthlyCapital);

// סנכרון מלא של כל נתוני ההון עם כל ההכנסות וההוצאות
router.post('/sync/full', authMiddleware.verifyToken, capitalController.syncFullCapital);

module.exports = router; 