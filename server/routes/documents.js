/**
 * נתיבי API למסמכים (חשבוניות, חשבוניות-קבלות, ואישורי הזמנה)
 */

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// מידדלוור אימות (למעט נתיבים ספציפיים)
router.use(auth);

// יצירת מסמך חדש
router.post('/', documentController.createDocument);

// בדיקה אם קיימת חשבונית להזמנה - חשוב שזה יהיה לפני הנתיב עם :id הכללי!
router.get('/check-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const invoice = await require('../models/Invoice').findOne({ booking: bookingId });
    
    return res.status(200).json({
      success: true,
      exists: !!invoice,
      invoice: invoice
    });
  } catch (error) {
    console.error('שגיאה בבדיקת קיום חשבונית:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת קיום חשבונית',
      error: error.message
    });
  }
});

// הורדת PDF של אישור הזמנה
router.get('/pdf/:id', async (req, res) => {
  try {
    const invoice = await require('../models/Invoice').findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).send('מסמך לא נמצא');
    }
    
    // אם זה אישור הזמנה, מחזיר את ה-PDF המקומי
    if (invoice.documentType === 'confirmation') {
      const pdfPath = path.join(__dirname, '..', 'uploads', 'invoices', `confirmation-${invoice.bookingNumber}.pdf`);
      
      if (fs.existsSync(pdfPath)) {
        return res.sendFile(pdfPath);
      } else {
        return res.status(404).send('קובץ PDF לא נמצא');
      }
    }
    
    // אם זו חשבונית של iCount, מפנה לקישור של iCount
    res.redirect(`https://icount.co.il/m/public2?invoiceid=${invoice.icountData.docNumber}`);
  } catch (error) {
    console.error('שגיאה בהורדת PDF:', error);
    res.status(500).send('שגיאה בהורדת הקובץ');
  }
});

// בדיקת חיבור ל-iCount
router.get('/check-connection', documentController.checkICountConnection);

// קבלת מסמך לפי מזהה - חשוב שזה יהיה האחרון כי זה הנתיב הכי כללי
router.get('/:id', documentController.getDocumentById);

module.exports = router; 