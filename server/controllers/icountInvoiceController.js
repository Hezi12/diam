const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const icountService = require('../services/icountService');
const invoiceMigrationService = require('../services/invoiceMigrationService');

/**
 * יצירת חשבונית ב-iCount ושמירת מידע רפרנס במונגו
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.createICountInvoice = async (req, res) => {
  try {
    const { invoiceData, bookingId } = req.body;
    
    if (!invoiceData) {
      return res.status(400).json({ 
        success: false, 
        error: 'נתוני החשבונית חסרים' 
      });
    }

    // בדיקה שפרטי הלקוח מלאים
    if (!invoiceData.customer || !invoiceData.customer.name) {
      return res.status(400).json({
        success: false,
        error: 'פרטי הלקוח חסרים או לא תקינים'
      });
    }

    // קביעת המיקום (airport או rothschild)
    const location = invoiceData.location || 'rothschild';
    
    // שליפת פרטי ההזמנה אם קיימת
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ 
          success: false, 
          error: `הזמנה עם מזהה ${bookingId} לא נמצאה` 
        });
      }
    }

    // בניית אובייקט החשבונית ל-iCount
    const icountInvoiceData = {
      // פרטי לקוח
      client_name: invoiceData.customer.name,
      email: invoiceData.customer.email || '',
      client_address: invoiceData.customer.address || '',
      
      // פרטי מסמך
      doctype: 'invoice', // סוג מסמך: חשבונית מס
      
      // פריטים
      items: invoiceData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitprice: item.unitPrice
      }))
    };

    // שליחת החשבונית ל-iCount
    const icountResponse = await icountService.createInvoice(location, icountInvoiceData);
    
    if (!icountResponse || !icountResponse.docnum) {
      return res.status(500).json({
        success: false,
        error: 'שגיאה ביצירת חשבונית ב-iCount',
        details: icountResponse
      });
    }

    // שמירת החשבונית גם במערכת הפנימית כרפרנס
    const internalInvoice = new Invoice({
      invoiceNumber: icountResponse.docnum,
      documentType: 'invoice',
      status: 'active',
      location: location,
      issueDate: new Date(),
      customer: invoiceData.customer,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal || 0,
      taxRate: invoiceData.taxRate || 17,
      taxAmount: invoiceData.taxAmount || 0,
      total: invoiceData.total || 0,
      notes: `חשבונית זו נוצרה במערכת iCount. מספר חשבונית ב-iCount: ${icountResponse.docnum}`,
      externalSystem: {
        name: 'iCount',
        invoiceId: icountResponse.docnum,
        data: icountResponse
      }
    });

    // קישור להזמנה אם קיימת
    if (booking) {
      internalInvoice.booking = booking._id;
      internalInvoice.bookingNumber = booking.bookingNumber;
      
      // עדכון ההזמנה עם מזהה החשבונית
      booking.invoice = internalInvoice._id;
      await booking.save();
    }

    // שמירת החשבונית הפנימית
    await internalInvoice.save();
    
    res.status(201).json({
      success: true,
      message: 'חשבונית נוצרה בהצלחה ב-iCount',
      invoice: internalInvoice,
      icountData: icountResponse
    });
    
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית ב-iCount:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת חשבונית',
      details: error.message
    });
  }
};

/**
 * ביטול חשבונית ב-iCount
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.cancelICountInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    // שליפת החשבונית הפנימית
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    if (!invoice.externalSystem || !invoice.externalSystem.invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'חשבונית זו לא מקושרת למערכת iCount'
      });
    }
    
    // כאן יהיה קוד לביטול החשבונית ב-iCount
    // כרגע אין לנו API מוכן לביטול חשבוניות, אלא רק ליצירה
    
    // עדכון סטטוס החשבונית הפנימית
    invoice.status = 'canceled';
    invoice.notes = `${invoice.notes ? invoice.notes + '\n' : ''}בוטל ב-${new Date().toLocaleDateString('he-IL')} - ${req.body.reason || 'ללא סיבה שצוינה'}`;
    
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'החשבונית בוטלה בהצלחה',
      invoice
    });
  } catch (error) {
    console.error('שגיאה בביטול חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בביטול החשבונית',
      error: error.message
    });
  }
};

/**
 * העברת חשבונית קיימת מהמערכת הישנה ל-iCount
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.migrateInvoiceToICount = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { location = 'rothschild' } = req.body;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: 'מיקום לא תקין. אנא ציין airport או rothschild'
      });
    }
    
    // שליפת החשבונית מהמערכת הפנימית
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'החשבונית לא נמצאה'
      });
    }
    
    // בדיקה שהחשבונית לא כבר ב-iCount
    if (invoice.externalSystem && invoice.externalSystem.name === 'iCount') {
      return res.status(400).json({
        success: false,
        error: 'חשבונית זו כבר קיימת במערכת iCount',
        icountInvoiceId: invoice.externalSystem.invoiceId
      });
    }
    
    // העברת החשבונית ל-iCount
    const updatedInvoice = await invoiceMigrationService.migrateInvoiceToICount(invoice, location);
    
    res.status(200).json({
      success: true,
      message: 'החשבונית הועברה בהצלחה ל-iCount',
      invoice: updatedInvoice
    });
    
  } catch (error) {
    console.error('שגיאה בהעברת חשבונית ל-iCount:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בהעברת חשבונית ל-iCount',
      details: error.message
    });
  }
};

/**
 * ביצוע מיגרציה המונית של חשבוניות ל-iCount
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.bulkMigrateInvoicesToICount = async (req, res) => {
  try {
    const { 
      location = 'rothschild', 
      dateFrom, 
      dateTo, 
      limit = 100 
    } = req.body;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: 'מיקום לא תקין. אנא ציין airport או rothschild'
      });
    }
    
    // בניית פילטר לבחירת חשבוניות להעברה
    const filter = {
      status: 'active'
    };
    
    // הוספת סינון לפי תאריכים אם צוינו
    if (dateFrom || dateTo) {
      filter.issueDate = {};
      
      if (dateFrom) {
        filter.issueDate.$gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        filter.issueDate.$lte = new Date(dateTo);
      }
    }
    
    // הוספת סינון לפי מיקום אם צוין
    if (location !== 'all') {
      filter.location = location;
    }
    
    // העברה המונית של חשבוניות
    const results = await invoiceMigrationService.bulkMigrateInvoicesToICount(filter, location);
    
    res.status(200).json({
      success: true,
      message: `הושלמה העברה של ${results.success} מתוך ${results.total} חשבוניות`,
      results
    });
    
  } catch (error) {
    console.error('שגיאה בהעברה המונית של חשבוניות ל-iCount:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בהעברה המונית של חשבוניות ל-iCount',
      details: error.message
    });
  }
}; 