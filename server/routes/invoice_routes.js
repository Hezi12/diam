const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const auth = require('../middleware/auth');

// הגדרת נתיבי חשבוניות
// ------------------------------

// הוספת חשבונית חדשה (POST)
router.post('/', auth, invoicesController.createInvoice);

// קבלת כל החשבוניות (GET)
router.get('/', auth, invoicesController.getInvoices);

// קבלת חשבונית ספציפית (GET)
router.get('/:id', auth, invoicesController.getInvoiceById);

// עדכון חשבונית קיימת (PUT)
router.put('/:id', auth, invoicesController.updateInvoice);

// ביטול חשבונית (PUT)
router.put('/:id/cancel', auth, invoicesController.cancelInvoice);

// יצירת PDF מחשבונית (GET)
router.get('/:id/pdf', auth, invoicesController.generatePdf);

// הורדת PDF של חשבונית (GET)
router.get('/:id/download', auth, invoicesController.downloadPdf);

// ייצוא הנתיבים
module.exports = router; 