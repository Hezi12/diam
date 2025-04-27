const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const auth = require('../middleware/auth');

// כל הנתיבים דורשים אימות
// נתיב להוספת חשבונית חדשה
router.post('/', auth, invoicesController.createInvoice);

// נתיב לקבלת כל החשבוניות
router.get('/', auth, invoicesController.getInvoices);

// נתיב לקבלת חשבונית ספציפית לפי מזהה
router.get('/:id', auth, invoicesController.getInvoiceById);

// נתיב לעדכון חשבונית קיימת
router.put('/:id', auth, invoicesController.updateInvoice);

// נתיב לביטול חשבונית
router.put('/:id/cancel', auth, invoicesController.cancelInvoice);

// נתיב ליצירת קובץ PDF של חשבונית
router.get('/:id/pdf', auth, invoicesController.generatePdf);

// נתיב להורדת קובץ PDF של חשבונית
router.get('/:id/download', auth, invoicesController.downloadPdf);

module.exports = router; 