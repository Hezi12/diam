const express = require('express');
const router = express.Router();
const icountService = require('../services/icountService');
const icountInvoiceController = require('../controllers/icountInvoiceController');

/**
 * נתיב להתחברות ל-iCount
 * POST /api/icount/login
 */
router.post('/login', async (req, res) => {
  try {
    const { location, companyId, username, password } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'חסר שדה location (airport או rothschild)' });
    }
    
    // שימוש בפרטי התחברות שסופקו או בברירות המחדל
    const sessionId = await icountService.login(location, companyId, username, password);
    res.json({ success: true, sessionId, location });
  } catch (error) {
    res.status(500).json({ 
      error: 'שגיאה בהתחברות למערכת', 
      details: error.message 
    });
  }
});

/**
 * נתיב ליצירת חשבונית
 * POST /api/icount/invoice
 */
router.post('/invoice', async (req, res) => {
  try {
    const { location, ...invoiceData } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'חסר שדה location (airport או rothschild)' });
    }
    
    if (!invoiceData) {
      return res.status(400).json({ error: 'חסרים נתוני חשבונית' });
    }
    
    const result = await icountService.createInvoice(location, invoiceData);
    res.json({ success: true, invoice: result });
  } catch (error) {
    res.status(500).json({ 
      error: 'שגיאה ביצירת חשבונית', 
      details: error.message 
    });
  }
});

/**
 * נתיב לחיוב כרטיס אשראי
 * POST /api/icount/charge
 */
router.post('/charge', async (req, res) => {
  try {
    const { location, ...paymentData } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'חסר שדה location (airport או rothschild)' });
    }
    
    if (!paymentData || !paymentData.sum) {
      return res.status(400).json({ error: 'חסרים נתוני תשלום' });
    }
    
    const result = await icountService.chargeCard(location, paymentData);
    res.json({ success: true, charge: result });
  } catch (error) {
    res.status(500).json({ 
      error: 'שגיאה בחיוב כרטיס אשראי', 
      details: error.message 
    });
  }
});

/**
 * נתיב משולב - חיוב וחשבונית
 * POST /api/icount/charge-and-invoice
 */
router.post('/charge-and-invoice', async (req, res) => {
  try {
    const { location, clientData, paymentData, invoiceData } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'חסר שדה location (airport או rothschild)' });
    }
    
    if (!clientData || !paymentData || !invoiceData) {
      return res.status(400).json({ error: 'חסרים נתוני לקוח/תשלום/חשבונית' });
    }
    
    if (!paymentData.sum) {
      return res.status(400).json({ error: 'חסר סכום לחיוב' });
    }
    
    const result = await icountService.chargeAndCreateInvoice(
      location, 
      clientData, 
      paymentData, 
      invoiceData
    );
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ 
      error: 'שגיאה בחיוב ויצירת חשבונית', 
      details: error.message 
    });
  }
});

/**
 * נתיב ליצירת חשבונית ושמירתה גם במערכת הפנימית
 * POST /api/icount/create-internal-invoice
 */
router.post('/create-internal-invoice', icountInvoiceController.createICountInvoice);

/**
 * נתיב לביטול חשבונית
 * POST /api/icount/cancel-invoice/:id
 */
router.post('/cancel-invoice/:id', icountInvoiceController.cancelICountInvoice);

/**
 * נתיב להעברת חשבונית קיימת מהמערכת הישנה ל-iCount
 * POST /api/icount/migrate-invoice/:invoiceId
 */
router.post('/migrate-invoice/:invoiceId', icountInvoiceController.migrateInvoiceToICount);

/**
 * נתיב להעברה המונית של חשבוניות ל-iCount
 * POST /api/icount/bulk-migrate
 */
router.post('/bulk-migrate', icountInvoiceController.bulkMigrateInvoicesToICount);

module.exports = router; 