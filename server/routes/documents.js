/**
 * נתיבי API למסמכים (חשבוניות, חשבוניות-קבלות)
 */

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// ביטול מידלוור האימות הגלובלי - נחיל אותו רק על נתיבים ספציפיים
// router.use(auth);

// יצירת מסמך חדש - דורש אימות
router.post('/', auth, documentController.createDocument);

// בדיקה אם קיימות חשבוניות להזמנה - דורש אימות
router.get('/check-booking/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const invoices = await require('../models/Invoice').find({ booking: bookingId });
    
    return res.status(200).json({
      success: true,
      exists: invoices.length > 0,
      invoices: invoices,
      // תמיכה לאחור - אם יש חשבונית אחת, נחזיר אותה גם בשדה invoice
      invoice: invoices.length > 0 ? invoices[0] : null
    });
  } catch (error) {
    console.error('שגיאה בבדיקת קיום חשבוניות:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת קיום חשבוניות',
      error: error.message
    });
  }
});

// הורדת PDF של מסמכים - כעת דורש אימות
router.get('/pdf/:id', auth, async (req, res) => {
  try {
    const invoice = await require('../models/Invoice').findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).send('מסמך לא נמצא');
    }
    

    
    // אם זו חשבונית של iCount, מפנה לקישור של iCount
    // ניסיון בלינק אחר ל-iCount
    console.log('מידע חשבונית:', {
      invoiceNumber: invoice.invoiceNumber,
      docNumber: invoice.icountData?.docNumber,
      location: invoice.location
    });
    
    // בדיקה אם המספר הוא מספרי או סטרינג עם תווים מיוחדים
    const isNumeric = /^\d+$/.test(invoice.invoiceNumber);
    const cleanInvoiceNumber = isNumeric ? invoice.invoiceNumber : encodeURIComponent(invoice.invoiceNumber);
    
    // שימוש בפורמט לינק אחר של iCount
    const icountUrl = `https://public.invoice4u.co.il/html/showdoc.aspx?doctype=inv&docnum=${cleanInvoiceNumber}`;
    console.log('מפנה לכתובת:', icountUrl);
    
    res.redirect(icountUrl);
  } catch (error) {
    console.error('שגיאה בהורדת PDF:', error);
    res.status(500).send('שגיאה בהורדת הקובץ');
  }
});

// בדיקת חיבור ל-iCount - דורש אימות
router.get('/check-connection', auth, documentController.checkICountConnection);

// נתיב לצפייה ברשימת מסמכים - כעת דורש אימות
router.get('/list-all', auth, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({}).populate('booking').sort({ createdAt: -1 });
    
    const invoicesList = invoices.map(invoice => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      documentType: invoice.documentType,
      bookingNumber: invoice.bookingNumber,
      customerName: invoice.customer?.name,
      amount: invoice.amount,
      createdAt: invoice.createdAt,
      pdfUrl: `/api/documents/pdf/${invoice._id}`
    }));
    
    res.json({
      success: true,
      count: invoicesList.length,
      invoices: invoicesList
    });
  } catch (error) {
    console.error('שגיאה בקבלת רשימת מסמכים:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בקבלת רשימת מסמכים',
      error: error.message
    });
  }
});

// דף HTML לצפייה במסמכים - כעת דורש אימות
router.get('/view-all', auth, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({}).populate('booking').sort({ createdAt: -1 });
    
    let html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>רשימת מסמכים - דיאם</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            tr:hover { background-color: #f8f9fa; }
            .btn { padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; }
            .btn:hover { background: #0056b3; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-invoice { background: #e3f2fd; color: #1976d2; }

            .badge-receipt { background: #e8f5e8; color: #388e3c; }
            .amount { font-weight: bold; color: #2e7d32; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>רשימת מסמכים במערכת</h1>
            <p><strong>סה"כ מסמכים:</strong> ${invoices.length}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>מספר מסמך</th>
                        <th>סוג מסמך</th>
                        <th>מספר הזמנה</th>
                        <th>שם לקוח</th>
                        <th>סכום</th>
                        <th>תאריך יצירה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>`;
    
    invoices.forEach(invoice => {
      const documentTypeText = {
        'invoice': 'חשבונית מס',
        'invoice_receipt': 'חשבונית מס/קבלה'
      };
      
      const badgeClass = {
        'invoice': 'badge-invoice',
        'invoice_receipt': 'badge-receipt'
      };
      
      html += `
                    <tr>
                        <td>${invoice.invoiceNumber}</td>
                        <td><span class="badge ${badgeClass[invoice.documentType] || 'badge-invoice'}">${documentTypeText[invoice.documentType] || invoice.documentType}</span></td>
                        <td>${invoice.bookingNumber || 'לא צוין'}</td>
                        <td>${invoice.customer?.name || 'לא צוין'}</td>
                        <td class="amount">${invoice.amount ? invoice.amount + ' ₪' : 'לא צוין'}</td>
                        <td>${new Date(invoice.createdAt).toLocaleDateString('he-IL')}</td>
                        <td>
                            מספר חשבונית: ${invoice.invoiceNumber}
                        </td>
                    </tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    </body>
    </html>`;
    
    res.send(html);
  } catch (error) {
    console.error('שגיאה בהצגת מסמכים:', error);
    res.status(500).send('שגיאה בהצגת מסמכים: ' + error.message);
  }
});

// קבלת מסמך לפי מזהה - דורש אימות
router.get('/:id', auth, documentController.getDocumentById);

module.exports = router; 