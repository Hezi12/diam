const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// הגדרת מיקום שמירת קבצים זמניים
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(process.env.UPLOAD_DIR || 'uploads', 'temp'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'invoice-' + uniqueSuffix + '.pdf');
  }
});

// הגדרת פילטר לקבצי PDF בלבד
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('רק קבצי PDF מותרים'), false);
  }
};

// יצירת מידדלוור להעלאת קבצים
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // מקסימום 5MB
  }
});

// טעינת מידדלוור אימות משתמש
router.use(auth);

// נתיבים בסיסיים
router.post('/', invoicesController.createInvoice);
router.get('/', invoicesController.getInvoices);
router.get('/:id', invoicesController.getInvoiceById);
router.patch('/:id/cancel', invoicesController.cancelInvoice);
router.post('/:id/credit', invoicesController.createCreditInvoice);

// נתיב לשמירת קובץ PDF
router.post('/:id/pdf', upload.single('pdf'), invoicesController.saveInvoicePdf);

module.exports = router; 