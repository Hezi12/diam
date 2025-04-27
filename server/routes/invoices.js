const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const { protect } = require('../middleware/authMiddleware');

// כל הנתיבים מוגנים ומחייבים אימות
router.use(protect);

// נתיבים לניהול חשבוניות
router.post('/', invoicesController.createInvoice);
router.get('/', invoicesController.getInvoices);
router.get('/booking/:bookingId', invoicesController.getInvoicesByBooking);
router.get('/:id', invoicesController.getInvoice);
router.put('/:id', invoicesController.updateInvoice);
router.put('/:id/cancel', invoicesController.cancelInvoice);
router.post('/:id/credit', invoicesController.createCreditInvoice);

// נתיבים להפקת והורדת PDF
router.get('/:id/pdf', invoicesController.generatePdf);
router.get('/:id/download', invoicesController.downloadPdf);

module.exports = router; 