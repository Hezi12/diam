const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * יצירת חשבונית חדשה
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 * @returns {Promise<void>}
 */
exports.createInvoice = async (req, res) => {
  try {
    const { invoiceData, bookingId } = req.body;
    
    // בדיקה שהנתונים נשלחו במבנה הנכון
    if (!invoiceData) {
      return res.status(400).json({ 
        success: false, 
        error: 'נתוני החשבונית חסרים. אנא שלח את הנתונים במבנה הנכון (invoiceData)' 
      });
    }

    // בדיקה שפרטי הלקוח קיימים
    if (!invoiceData.customer || !invoiceData.customer.name) {
      return res.status(400).json({
        success: false,
        error: 'פרטי הלקוח חסרים או לא תקינים'
      });
    }

    // קבלת מספר חשבונית חדש ממסד הנתונים
    const invoiceNumber = await getNextInvoiceNumber();
    
    // יצירת אובייקט חשבונית עם מספר חשבונית ייחודי
    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber,
      status: invoiceData.status || 'active' // שימוש בסטטוס ברירת מחדל אם לא סופק
    });

    // קישור להזמנה אם נשלח מזהה הזמנה
    if (bookingId) {
      try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
          return res.status(404).json({ 
            success: false, 
            error: `הזמנה עם מזהה ${bookingId} לא נמצאה` 
          });
      }
        
        // קישור בין החשבונית להזמנה
        invoice.booking = bookingId;
        
        // אם אין פרטי לקוח בחשבונית, השתמש בפרטי הלקוח מההזמנה
        if (!invoice.customer || Object.keys(invoice.customer).length === 0) {
          invoice.customer = booking.customer;
        }
        
        // עדכון ההזמנה עם מזהה החשבונית
        booking.invoice = invoice._id;
        await booking.save();
      } catch (bookingError) {
        console.error('שגיאה בטיפול בהזמנה:', bookingError);
        return res.status(500).json({
          success: false,
          error: 'שגיאה בקישור החשבונית להזמנה',
          details: bookingError.message
        });
      }
    }

    // שמירת החשבונית החדשה
    await invoice.save();
    
    res.status(201).json({
      success: true,
      message: 'חשבונית נוצרה בהצלחה',
      invoice
    });
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית:', error);
    
    // טיפול בשגיאות ולידציה
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      // מיפוי שגיאות הולידציה
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        error: 'שגיאת ולידציה',
        validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'שגיאת שרת בעת יצירת חשבונית',
      details: error.message
    });
  }
};

/**
 * קבלת רשימת חשבוניות עם אפשרויות סינון וחיפוש
 */
exports.getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'issueDate',
      sortDirection = 'desc',
      status,
      customer,
      fromDate,
      toDate,
      invoiceNumber,
      minAmount,
      maxAmount
    } = req.query;
    
    // בניית מסנן הזמנות
    const filter = {};
    
    // סינון לפי סטטוס
    if (status) {
      filter.status = status;
    }
    
    // סינון לפי מספר חשבונית
    if (invoiceNumber) {
      filter.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
    }
    
    // סינון לפי לקוח
    if (customer) {
      filter['customer.name'] = { $regex: customer, $options: 'i' };
    }
    
    // סינון לפי טווח תאריכים
    if (fromDate || toDate) {
      filter.issueDate = {};
      
      if (fromDate) {
        filter.issueDate.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        filter.issueDate.$lte = new Date(toDate);
      }
    }
    
    // סינון לפי טווח סכומים
    if (minAmount || maxAmount) {
      filter.total = {};
      
      if (minAmount) {
        filter.total.$gte = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        filter.total.$lte = parseFloat(maxAmount);
      }
    }
    
    // מיון
    const sort = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;
    
    // חישוב דילוג לעמוד
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // שליפת החשבוניות מהמסד נתונים
    const invoices = await Invoice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('booking', 'roomType checkIn checkOut');
    
    // ספירת סך כל החשבוניות עבור דפדוף
    const total = await Invoice.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת חשבוניות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת החשבוניות',
      error: error.message
    });
  }
};

/**
 * קבלת חשבונית לפי מזהה
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('booking')
      .populate('relatedInvoices');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('שגיאה בקבלת חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת החשבונית',
      error: error.message
    });
  }
};

/**
 * ביטול חשבונית
 */
exports.cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    // בדיקה אם החשבונית כבר בוטלה
    if (invoice.status === 'canceled') {
      return res.status(400).json({
        success: false,
        message: 'החשבונית כבר בוטלה'
      });
    }
    
    // עדכון סטטוס החשבונית
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
 * יצירת חשבונית זיכוי
 */
exports.createCreditInvoice = async (req, res) => {
  try {
    const originalInvoice = await Invoice.findById(req.params.id);
    
    if (!originalInvoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית המקורית לא נמצאה'
      });
    }
    
    // בדיקה אם החשבונית כבר בוטלה
    if (originalInvoice.status === 'canceled') {
      return res.status(400).json({
        success: false,
        message: 'החשבונית כבר בוטלה, לא ניתן להפיק חשבונית זיכוי'
      });
    }
    
    // קבלת המספר הבא בסדרה
    const nextInvoiceNumber = await getNextInvoiceNumber();
    
    // יצירת חשבונית זיכוי
    const creditInvoiceData = {
      invoiceNumber: nextInvoiceNumber,
      documentType: 'credit_invoice',
      status: 'active',
      issueDate: new Date(),
      customer: originalInvoice.customer,
      booking: originalInvoice.booking,
      items: originalInvoice.items.map(item => ({
        ...item.toObject(),
        unitPrice: -Math.abs(item.unitPrice),
        totalPrice: -Math.abs(item.totalPrice)
      })),
      subtotal: -Math.abs(originalInvoice.subtotal),
      taxRate: originalInvoice.taxRate,
      taxAmount: -Math.abs(originalInvoice.taxAmount),
      discount: -Math.abs(originalInvoice.discount),
      total: -Math.abs(originalInvoice.total),
      paymentMethod: originalInvoice.paymentMethod,
      paymentDetails: originalInvoice.paymentDetails,
      business: originalInvoice.business,
      notes: `חשבונית זיכוי עבור חשבונית מספר ${originalInvoice.invoiceNumber} מתאריך ${new Date(originalInvoice.issueDate).toLocaleDateString('he-IL')}. סיבה: ${req.body.reason || 'ללא סיבה שצוינה'}`,
      relatedInvoices: [originalInvoice._id],
      createdBy: req.user._id
    };
    
    // יצירת חשבונית זיכוי חדשה
    const creditInvoice = new Invoice(creditInvoiceData);
    await creditInvoice.save();
    
    // עדכון החשבונית המקורית
    originalInvoice.status = 'replaced';
    originalInvoice.relatedInvoices = originalInvoice.relatedInvoices || [];
    originalInvoice.relatedInvoices.push(creditInvoice._id);
    await originalInvoice.save();
    
    res.status(201).json({
      success: true,
      message: 'חשבונית זיכוי נוצרה בהצלחה',
      creditInvoice
    });
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית זיכוי:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה ביצירת חשבונית זיכוי',
      error: error.message
    });
  }
};

/**
 * הורדת קובץ PDF של חשבונית
 */
exports.getInvoicePdf = async (req, res) => {
  try {
    // הוספת headers לטיפול בבעיות CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    // אם אין קובץ PDF מקושר לחשבונית
    if (!invoice.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'לא נמצא קובץ PDF לחשבונית זו'
      });
    }
    
    // הסרת הקידומת "/uploads/" מהנתיב
    const relativePath = invoice.pdfUrl.replace(/^\/uploads\//, '');
    const filePath = path.join(process.env.UPLOAD_DIR || 'uploads', relativePath);
    
    // בדיקה שהקובץ קיים
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'קובץ ה-PDF לא נמצא במערכת'
      });
    }
    
    // שליחת הקובץ ללקוח
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    
    // שליחת הקובץ כמענה לבקשה
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('שגיאה בהורדת קובץ PDF:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בהורדת קובץ ה-PDF',
      error: error.message
    });
  }
};

/**
 * שמירת קובץ PDF של חשבונית
 */
exports.saveInvoicePdf = async (req, res) => {
  try {
    // הוספת headers לטיפול בבעיות CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'לא התקבל קובץ PDF'
      });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      // מחיקת הקובץ הזמני אם החשבונית לא נמצאה
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    // הגדרת תיקיית היעד לקבצי PDF של חשבוניות
    const invoicesDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'invoices');
    
    // יצירת התיקייה אם היא לא קיימת
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    
    // שם קובץ קבוע לפי מזהה החשבונית
    const fileName = `invoice-${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    
    // העברת הקובץ מהתיקייה הזמנית לתיקיית היעד
    fs.renameSync(req.file.path, filePath);
    
    // עדכון נתיב הקובץ בחשבונית
    invoice.pdfUrl = `/uploads/invoices/${fileName}`;
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'קובץ PDF נשמר בהצלחה',
      pdfUrl: invoice.pdfUrl
    });
  } catch (error) {
    console.error('שגיאה בשמירת קובץ PDF:', error);
    
    // מחיקת הקובץ הזמני במקרה של שגיאה
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בשמירת קובץ PDF',
      error: error.message
    });
  }
};

/**
 * פונקציה פנימית - קבלת מספר חשבונית הבא בסדרה
 */
async function getNextInvoiceNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // בדיקה אם קיימות חשבוניות כבר לחודש הנוכחי
  const regexPattern = `^${year}-${month}-`;
  
  // קבלת החשבונית האחרונה עם הפרפיקס הזה
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: regexPattern }
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  
  if (lastInvoice) {
    // חילוץ המספר מהמספר האחרון
    const lastNumberStr = lastInvoice.invoiceNumber.split('-')[2];
    const lastNumber = parseInt(lastNumberStr, 10);
    
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  // מספר חשבונית בפורמט: YYYY-MM-NNNN
  return `${year}-${month}-${String(nextNumber).padStart(4, '0')}`;
} 