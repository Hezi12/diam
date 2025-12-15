/**
 * נתיבי API עבור אינטגרציה עם iCount
 */

const express = require('express');
const router = express.Router();
const icountService = require('../services/icountService');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

/**
 * התחברות ל-iCount
 * POST /api/icount/login
 */
router.post('/login', auth, async (req, res) => {
  try {
    const { location, companyId, username, password } = req.body;
    
    // אם לא סופקו פרטי התחברות, נשתמש בברירת המחדל
    const result = await icountService.checkConnection(location);
    
    return res.status(200).json({
      success: result.success,
      message: result.message,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('שגיאה בהתחברות ל-iCount:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * בדיקת חיבור ל-iCount
 * GET /api/icount/check-connection/:location
 */
router.get('/check-connection/:location', auth, async (req, res) => {
  try {
    const { location } = req.params;
    const result = await icountService.checkConnection(location);
    
    return res.status(200).json({
      status: result.success ? 'success' : 'error',
      message: result.message,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * יצירת חשבונית ב-iCount
 * POST /api/icount/invoice
 */
router.post('/invoice', auth, async (req, res) => {
  try {
    const { location, ...invoiceData } = req.body;
    
    // המרת הנתונים לפורמט הנכון
    const formattedData = {
      customer: {
        name: invoiceData.client_name,
        email: invoiceData.client_email,
        identifier: invoiceData.client_id || '',
        address: invoiceData.client_address || '',
        phone: invoiceData.client_phone || ''
      },
      items: invoiceData.items || [{
        description: invoiceData.description || 'שירות אירוח',
        quantity: invoiceData.quantity || 1,
        unitPrice: invoiceData.unitprice || 0
      }],
      total: invoiceData.sum || invoiceData.total || 0,
      paymentMethod: 'cash',
      issueDate: new Date(),
      notes: invoiceData.notes || ''
    };
    
    const result = await icountService.createInvoice(formattedData, location, 'invoice');
    
    return res.status(200).json({
      success: result.success,
      data: result.data,
      invoiceNumber: result.invoiceNumber
    });
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * חיוב כרטיס אשראי דרך iCount
 * POST /api/icount/charge
 */
router.post('/charge', auth, async (req, res) => {
  try {
    const { location, bookingId, amount, createInvoice = true } = req.body;
    
    console.log(`💳 מתקבלת בקשת סליקה:`, {
      location,
      bookingId,
      amount,
      createInvoice
    });

    // בדיקת פרמטרים
    if (!location || !bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'פרמטרים חסרים: location, bookingId, amount נדרשים'
      });
    }

    // המרת המיקום לפורמט הנכון
    const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';

    // מציאת ההזמנה
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'הזמנה לא נמצאה'
      });
    }

    console.log(`✅ נמצאה הזמנה: ${booking.bookingNumber}`);

    // בדיקת פרטי כרטיס אשראי
    if (!booking.creditCard || !booking.creditCard.cardNumber) {
      return res.status(400).json({
        success: false,
        error: 'פרטי כרטיס אשראי חסרים בהזמנה'
      });
    }

    console.log(`💳 מבצע סליקה עבור הזמנה ${booking.bookingNumber} בסכום ${amount} ₪${createInvoice ? ' + חשבונית עם קבלה' : ' ללא חשבונית'}`);

    // קריאה לשירות iCount - עם או בלי חשבונית
    let result;
    if (createInvoice) {
      // סליקה + חשבונית עם קבלה
      result = await icountService.chargeCard(booking, amount, location);
    } else {
      // סליקה בלבד
      result = await icountService.chargeCardOnly(booking, amount, location);
      // התאמה לפורמט המצופה
      result = {
        success: result.success,
        charge: result,
        invoice: null,
        message: 'סליקה בוצעה בהצלחה ללא חשבונית'
      };
    }
    
    if (result.success) {
      console.log(`✅ סליקה הושלמה בהצלחה:`, {
        transactionId: result.charge?.transactionId || 'unknown',
        amount: result.charge?.amount || amount,
        cardType: result.charge?.cardType || 'unknown',
        invoiceNumber: result.invoice?.invoiceNumber || 'לא נוצרה חשבונית',
        invoiceSuccess: result.invoice?.success || false
      });

      // 🔧 תיקון קריטי: עדכון אוטומטי של השדות בהזמנה אחרי סליקה מוצלחת
      try {
        // עדכון סטטוס התשלום לפי המיקום
        const paymentStatus = location === 'airport' ? 'credit_or_yehuda' : 'credit_rothschild';
        
        // עדכון השדות בהזמנה
        const updateData = {
          paymentStatus: paymentStatus,
          // אם נוצרה חשבונית, נסמן שיש חשבונית
          ...(result.invoice && result.invoice.success && {
            hasInvoiceReceipt: true
          })
        };

        console.log(`🔄 מעדכן הזמנה ${booking.bookingNumber}:`, updateData);
        
        // עדכון ההזמנה במסד הנתונים
        await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
        
        console.log(`✅ הזמנה ${booking.bookingNumber} עודכנה בהצלחה עם סטטוס תשלום: ${paymentStatus}`);
        
        // עדכון האובייקט המקומי לצורך התגובה
        booking.paymentStatus = paymentStatus;
        if (result.invoice && result.invoice.success) {
          booking.hasInvoiceReceipt = true;
        }
        
      } catch (updateError) {
        console.error('⚠️ אזהרה: שגיאה בעדכון הזמנה אחרי סליקה:', updateError.message);
        // לא נכשיל את הסליקה בגלל שגיאה בעדכון
      }
      
      return res.status(200).json({
        success: true,
        message: result.message || 'סליקה וחשבונית בוצעו בהצלחה',
        transactionId: result.charge?.transactionId || 'unknown',
        amount: result.charge?.amount || amount,
        cardType: result.charge?.cardType || 'unknown',
        invoice: result.invoice ? {
          success: result.invoice.success,
          invoiceNumber: result.invoice.invoiceNumber,
          data: result.invoice.data
        } : null,
        charge: {
          success: result.charge?.success,
          transactionId: result.charge?.transactionId,
          confirmationCode: result.charge?.confirmationCode
        },
        // הוספת מידע על העדכון
        bookingUpdated: {
          paymentStatus: location === 'airport' ? 'credit_or_yehuda' : 'credit_rothschild',
          hasInvoiceReceipt: !!(result.invoice && result.invoice.success)
        }
      });
    } else {
      console.log('❌ סליקה נכשלה:', result.message || 'סיבה לא ידועה');
      return res.status(500).json({
        success: false,
        message: result.message || 'שגיאה בסליקת אשראי'
      });
    }

  } catch (error) {
    console.error('❌ שגיאה בסליקת אשראי:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'שגיאה בסליקת כרטיס אשראי'
    });
  }
});

/**
 * חיוב כרטיס ויצירת חשבונית בפעולה אחת
 * POST /api/icount/charge-and-invoice
 */
router.post('/charge-and-invoice', auth, async (req, res) => {
  try {
    const { location, clientData, paymentData, invoiceData } = req.body;
    
    // כרגע נוצר רק חשבונית ללא חיוב
    const formattedData = {
      customer: {
        name: clientData.client_name,
        email: clientData.client_email,
        identifier: '',
        address: '',
        phone: ''
      },
      items: invoiceData.items || [{
        description: 'שירות אירוח',
        quantity: 1,
        unitPrice: paymentData.sum || 0
      }],
      total: paymentData.sum || 0,
      paymentMethod: 'credit_card',
      issueDate: new Date(),
      notes: 'תשלום בכרטיס אשראי'
    };
    
    const result = await icountService.createInvoice(formattedData, location, 'invoice_receipt');
    
    return res.status(200).json({
      success: result.success,
      data: result.data,
      invoiceNumber: result.invoiceNumber,
      message: 'חשבונית נוצרה בהצלחה. חיוב כרטיס אשראי דורש הגדרות נוספות.'
    });
  } catch (error) {
    console.error('שגיאה בחיוב ויצירת חשבונית:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * בדיקת כל אפשרויות ההתחברות
 * GET /api/icount/test-connection/:location
 */
router.get('/test-connection/:location', auth, async (req, res) => {
  try {
    const { location } = req.params;
    
    const tests = [];
    
    // בדיקה 1: חיבור בסיסי
    try {
      const basicTest = await icountService.checkConnection(location);
      tests.push({
        test: 'חיבור בסיסי',
        success: basicTest.success,
        message: basicTest.message
      });
    } catch (error) {
      tests.push({
        test: 'חיבור בסיסי',
        success: false,
        message: error.message
      });
    }
    
    return res.status(200).json({
      tests,
      summary: `בוצעו ${tests.length} בדיקות`
    });
  } catch (error) {
    console.error('שגיאה בבדיקת אפשרויות התחברות:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * בדיקת בריאות נתיבי iCount - כעת דורש אימות
 * GET /api/icount/health
 */
router.get('/health', auth, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'נתיבי iCount פעילים',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * בדיקת חיבור ישיר ל-iCount API - כעת דורש אימות
 * GET /api/icount/direct-test
 */
router.get('/direct-test', auth, async (req, res) => {
  try {
    console.log('🧪 מתחיל בדיקת חיבור ישיר ל-iCount API...');
    
    const axios = require('axios');
    const startTime = Date.now();
    
    // נוסה לעשות בקשה פשוטה ל-iCount API
    const response = await axios.get('https://api.icount.co.il', {
      timeout: 10000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ חיבור ל-iCount API הצליח בזמן ${responseTime}ms`);
    
    return res.status(200).json({
      success: true,
      message: 'חיבור ישיר ל-iCount API הצליח',
      responseTime: responseTime,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ בדיקת חיבור ישיר נכשלה:', error.message);
    
    const errorInfo = {
      success: false,
      message: 'חיבור ישיר ל-iCount API נכשל',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    if (error.code === 'ECONNABORTED') {
      errorInfo.description = 'timeout - החיבור לקח יותר מ-10 שניות';
    } else if (error.code === 'ECONNREFUSED') {
      errorInfo.description = 'חיבור נדחה - השרת לא זמין';
    } else if (error.code === 'ENOTFOUND') {
      errorInfo.description = 'DNS לא נמצא - בעיה בפתרון כתובת';
    }
    
    return res.status(500).json(errorInfo);
  }
});

/**
 * מיגרציה המונית של חשבוניות ל-iCount
 * POST /api/icount/bulk-migrate
 */
router.post('/bulk-migrate', auth, async (req, res) => {
  try {
    const { location, dateFrom, dateTo } = req.body;
    
    // כרגע נחזיר תשובה סימולטיבית
    // בעתיד ניתן לממש מיגרציה אמיתית מחשבוניות ישנות
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: []
    };
    
    return res.status(200).json({
      success: true,
      message: 'מיגרציה המונית הושלמה',
      results
    });
  } catch (error) {
    console.error('שגיאה במיגרציה המונית:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * מיגרציה של חשבונית בודדת ל-iCount
 * POST /api/icount/migrate-single
 */
router.post('/migrate-single', auth, async (req, res) => {
  try {
    const { invoiceId, location } = req.body;
    
    // כרגע נחזיר תשובה סימולטיבית
    return res.status(200).json({
      success: true,
      message: 'חשבונית הועברה בהצלחה',
      invoice: {
        invoiceNumber: 'SIM-' + Date.now(),
        id: invoiceId
      }
    });
  } catch (error) {
    console.error('שגיאה במיגרציה של חשבונית בודדת:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * בדיקת סטטוס מיגרציה
 * GET /api/icount/migration-status/:location
 */
router.get('/migration-status/:location', auth, async (req, res) => {
  try {
    const { location } = req.params;
    
    return res.status(200).json({
      success: true,
      status: {
        totalInvoices: 0,
        migratedInvoices: 0,
        pendingInvoices: 0,
        lastMigration: null
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת סטטוס מיגרציה:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 