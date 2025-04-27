const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { generateInvoicePdf } = require('../utils/pdfGenerator');

/**
 * הפקת חשבונית חדשה
 * @route POST /api/invoices
 * @access Private
 */
exports.createInvoice = async (req, res) => {
  try {
    console.log('מתחיל יצירת חשבונית חדשה, נתונים שהתקבלו:', JSON.stringify(req.body));
    
    const {
      booking: bookingId,
      customer,
      isTourist,
      notes,
      paymentDetails
    } = req.body;

    // וידוא שהנתונים שהתקבלו תקינים
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'נדרש מזהה הזמנה ליצירת חשבונית' 
      });
    }

    // וידוא שקיימת הזמנה תקפה
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      console.error(`ההזמנה עם מזהה ${bookingId} לא נמצאה במערכת`);
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }

    console.log(`נמצאה הזמנה: ${booking._id}, מיקום: ${booking.location}`);

    // חישוב ערכים לפי נתוני ההזמנה
    let subtotal, vatAmount;
    try {
      subtotal = booking.isTourist ? booking.price : parseFloat((booking.price / 1.17).toFixed(2));
      vatAmount = booking.isTourist ? 0 : parseFloat((booking.price - subtotal).toFixed(2));
    } catch (calcError) {
      console.error('שגיאה בחישוב מע"מ:', calcError);
      subtotal = booking.price;
      vatAmount = 0;
    }

    console.log(`חישוב מחירים - סכום לפני מע"מ: ${subtotal}, מע"מ: ${vatAmount}`);

    // יצירת אובייקט החשבונית
    const newInvoice = new Invoice({
      booking: bookingId,
      location: booking.location,
      isTourist: isTourist || booking.isTourist,
      customer: {
        name: customer?.name || `${booking.firstName} ${booking.lastName}`,
        phone: customer?.phone || booking.phone,
        email: customer?.email || booking.email,
        idNumber: customer?.idNumber || '',
        address: customer?.address || '',
        passportNumber: customer?.passportNumber || (booking.isTourist ? 'תייר' : '')
      },
      serviceDetails: {
        description: `לינה ${booking.location === 'airport' ? 'באור יהודה' : 'ברוטשילד'}`,
        fromDate: booking.checkIn,
        toDate: booking.checkOut,
        nights: booking.nights || 1,
        roomNumber: booking.roomNumber || (booking.room?.roomNumber || '101')
      },
      paymentDetails: {
        subtotal: paymentDetails?.subtotal || subtotal,
        vatRate: booking.isTourist ? 0 : 17,
        vatAmount: paymentDetails?.vatAmount || vatAmount,
        discount: paymentDetails?.discount || booking.discount || 0,
        total: paymentDetails?.total || booking.price,
        paymentMethod: paymentDetails?.paymentMethod || mapBookingPaymentToInvoicePayment(booking.paymentStatus)
      },
      notes: notes || ''
    });

    console.log('חשבונית מוכנה לשמירה:', JSON.stringify(newInvoice));

    // שמירת החשבונית
    await newInvoice.save();
    console.log(`חשבונית נשמרה בהצלחה עם מזהה: ${newInvoice._id}`);

    res.status(201).json({
      success: true,
      data: newInvoice,
      message: 'החשבונית נוצרה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת החשבונית',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

/**
 * קבלת כל החשבוניות
 * @route GET /api/invoices
 * @access Private
 */
exports.getInvoices = async (req, res) => {
  try {
    // פרמטרים לסינון וחיפוש
    const {
      location,
      customer,
      fromDate,
      toDate,
      status,
      sort = '-createdAt',
      limit = 100
    } = req.query;

    // בניית שאילתת חיפוש
    const query = {};

    // סינון לפי מיקום
    if (location) {
      query.location = location;
    }

    // סינון לפי לקוח (חיפוש בשם)
    if (customer) {
      query['customer.name'] = { $regex: customer, $options: 'i' };
    }

    // סינון לפי תאריך הנפקה
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) {
        query.issueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.issueDate.$lte = new Date(toDate);
      }
    }

    // סינון לפי סטטוס
    if (status) {
      query.status = status;
    }

    // שליפת החשבוניות
    const invoices = await Invoice.find(query)
      .populate('booking', 'bookingNumber firstName lastName checkIn checkOut')
      .sort(sort)
      .limit(parseInt(limit));

    // ספירת כמות החשבוניות העונות לקריטריונים
    const total = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      data: invoices
    });
  } catch (error) {
    console.error('שגיאה בשליפת חשבוניות:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשליפת החשבוניות',
      error: error.message
    });
  }
};

/**
 * קבלת חשבונית לפי מזהה
 * @route GET /api/invoices/:id
 * @access Private
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }

    // שליפת החשבונית
    const invoice = await Invoice.findById(id)
      .populate('booking', 'bookingNumber firstName lastName checkIn checkOut room')
      .populate({
        path: 'booking',
        populate: {
          path: 'room',
          select: 'roomNumber category'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('שגיאה בשליפת חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשליפת החשבונית',
      error: error.message
    });
  }
};

/**
 * עדכון חשבונית
 * @route PUT /api/invoices/:id
 * @access Private
 */
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }

    // בדיקה אם החשבונית במצב שניתן לעדכן (טיוטה)
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }

    // לא ניתן לעדכן חשבונית שכבר הונפקה (מלבד שינוי סטטוס)
    if (invoice.status !== 'draft' && !updateData.status) {
      return res.status(400).json({
        success: false,
        message: 'לא ניתן לעדכן חשבונית שכבר הונפקה'
      });
    }

    // עדכון החשבונית
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedInvoice,
      message: 'החשבונית עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בעדכון חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון החשבונית',
      error: error.message
    });
  }
};

/**
 * ביטול חשבונית קיימת
 * @param {Object} req - בקשת HTTP 
 * @param {Object} res - תשובת HTTP
 */
exports.cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // וידוא שהמזהה תקין
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }
    
    // חיפוש החשבונית לפי מזהה
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    // בדיקה שהחשבונית במצב שמאפשר ביטול
    if (invoice.status === 'cancelled' || invoice.status === 'void') {
      return res.status(400).json({
        success: false,
        message: 'החשבונית כבר מבוטלת'
      });
    }
    
    // עדכון סטטוס החשבונית לבטל
    invoice.status = 'cancelled';
    invoice.cancellationReason = reason;
    invoice.cancelledAt = new Date();
    
    await invoice.save();
    
    return res.status(200).json({
      success: true,
      message: 'החשבונית בוטלה בהצלחה',
      data: invoice
    });
  } catch (error) {
    console.error('שגיאה בביטול חשבונית:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאת שרת בביטול החשבונית',
      error: error.message
    });
  }
};

/**
 * הפקת חשבונית זיכוי
 * @route POST /api/invoices/:id/credit
 * @access Private
 */
exports.createCreditInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }

    // שליפת החשבונית המקורית
    const originalInvoice = await Invoice.findById(id);
    if (!originalInvoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית המקורית לא נמצאה'
      });
    }

    // בדיקה שהחשבונית המקורית הונפקה
    if (originalInvoice.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: 'ניתן להנפיק חשבונית זיכוי רק לחשבוניות שהונפקו'
      });
    }

    // הכנת נתוני חשבונית הזיכוי
    const creditInvoice = new Invoice({
      booking: originalInvoice.booking,
      location: originalInvoice.location,
      isTourist: originalInvoice.isTourist,
      customer: originalInvoice.customer,
      serviceDetails: {
        ...originalInvoice.serviceDetails,
        description: `זיכוי עבור: ${originalInvoice.serviceDetails.description}`
      },
      paymentDetails: {
        subtotal: -originalInvoice.paymentDetails.subtotal,
        vatRate: originalInvoice.paymentDetails.vatRate,
        vatAmount: -originalInvoice.paymentDetails.vatAmount,
        discount: -originalInvoice.paymentDetails.discount,
        total: -originalInvoice.paymentDetails.total,
        paymentMethod: originalInvoice.paymentDetails.paymentMethod
      },
      notes: reason 
        ? `חשבונית זיכוי עבור חשבונית מס' ${originalInvoice.invoiceNumber}. סיבה: ${reason}` 
        : `חשבונית זיכוי עבור חשבונית מס' ${originalInvoice.invoiceNumber}`,
      isOriginal: false,
      relatedInvoice: originalInvoice._id,
      status: 'issued' // חשבונית זיכוי מונפקת ישירות
    });

    // שמירת חשבונית הזיכוי
    await creditInvoice.save();

    // עדכון החשבונית המקורית - קישור לחשבונית הזיכוי
    originalInvoice.relatedInvoice = creditInvoice._id;
    await originalInvoice.save();

    res.status(201).json({
      success: true,
      data: creditInvoice,
      message: 'חשבונית זיכוי נוצרה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית זיכוי:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת חשבונית זיכוי',
      error: error.message
    });
  }
};

/**
 * קבלת חשבוניות להזמנה ספציפית
 * @route GET /api/invoices/booking/:bookingId
 * @access Private
 */
exports.getInvoicesByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה הזמנה לא תקין'
      });
    }

    // שליפת החשבוניות להזמנה
    const invoices = await Invoice.find({ booking: bookingId })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('שגיאה בשליפת חשבוניות להזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשליפת חשבוניות להזמנה',
      error: error.message
    });
  }
};

/**
 * המרת סטטוס תשלום של הזמנה לאמצעי תשלום לחשבונית
 * @param {string} bookingPaymentStatus - סטטוס תשלום של הזמנה
 * @returns {string} - אמצעי תשלום לחשבונית
 */
function mapBookingPaymentToInvoicePayment(bookingPaymentStatus) {
  const paymentMap = {
    'cash': 'cash',
    'credit_or_yehuda': 'credit_card',
    'credit_rothschild': 'credit_card',
    'transfer_mizrahi': 'bank_transfer',
    'transfer_poalim': 'bank_transfer',
    'bit_mizrahi': 'bit',
    'bit_poalim': 'bit',
    'paybox_mizrahi': 'paybox',
    'paybox_poalim': 'paybox',
    'other': 'other'
  };

  return paymentMap[bookingPaymentStatus] || 'other';
}

/**
 * הפקת חשבונית PDF
 * @route GET /api/invoices/:id/pdf
 * @access Private
 */
exports.generatePdf = async (req, res) => {
  try {
    console.log('מתחיל תהליך הפקת PDF, ID חשבונית:', req.params.id);
    const { id } = req.params;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('מזהה חשבונית לא תקין:', id);
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }

    // שליפת החשבונית
    console.log('מנסה למצוא חשבונית במסד הנתונים');
    const invoice = await Invoice.findById(id)
      .populate('booking', 'bookingNumber firstName lastName checkIn checkOut')
      .populate({
        path: 'booking',
        populate: {
          path: 'room',
          select: 'roomNumber category'
        }
      });

    if (!invoice) {
      console.error('החשבונית לא נמצאה:', id);
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }
    
    console.log('חשבונית נמצאה:', invoice._id);

    // בדיקה שכל השדות החובה קיימים
    const requiredFields = ['customer', 'serviceDetails', 'paymentDetails'];
    for (const field of requiredFields) {
      if (!invoice[field]) {
        console.error(`שדה חובה חסר בחשבונית: ${field}`);
        return res.status(400).json({
          success: false,
          message: `שדה חובה חסר בחשבונית: ${field}`
        });
      }
    }

    // וידוא שתיקיית היעד קיימת
    const invoicesDir = path.join(__dirname, '../uploads/invoices');
    if (!fs.existsSync(invoicesDir)) {
      console.log(`יוצר תיקיית uploads/invoices`);
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // הפקת ה-PDF
    console.log('מתחיל להפיק PDF');
    const fileName = `invoice_${invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/invoices', fileName);
    console.log('נתיב ליצירת קובץ PDF:', outputPath);
    
    try {
      const pdfPath = await generateInvoicePdf(invoice, outputPath);
      console.log('PDF נוצר בהצלחה:', pdfPath);

      // שינוי סטטוס החשבונית ל-issued אם היא בסטטוס draft
      if (invoice.status === 'draft') {
        console.log('עדכון סטטוס החשבונית ל-issued');
        invoice.status = 'issued';
        await invoice.save();
        console.log('סטטוס חשבונית עודכן בהצלחה');
      }

      // בדיקה שהקובץ אכן נוצר
      if (!fs.existsSync(pdfPath)) {
        throw new Error('הקובץ לא נוצר בנתיב שצוין');
      }

      // החזרת נתיב הקובץ
      const relativePath = pdfPath.replace(/^.*\/uploads/, '/uploads');
      console.log('מחזיר נתיב יחסי:', relativePath);
      
      res.status(200).json({
        success: true,
        data: {
          pdfPath: relativePath,
          invoiceNumber: invoice.invoiceNumber,
          absolutePath: pdfPath // רק לצורכי דיבוג
        },
        message: 'החשבונית הופקה בהצלחה'
      });
    } catch (pdfError) {
      console.error('שגיאה בהפקת ה-PDF:', pdfError);
      console.error('פירוט השגיאה:', pdfError.stack);
      
      return res.status(500).json({
        success: false,
        message: 'שגיאה בהפקת ה-PDF',
        error: pdfError.message,
        stack: process.env.NODE_ENV === 'production' ? null : pdfError.stack
      });
    }
  } catch (error) {
    console.error('שגיאה כללית בהפקת חשבונית PDF:', error);
    console.error('פירוט השגיאה:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'שגיאה בהפקת חשבונית PDF',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

/**
 * הורדת חשבונית PDF
 * @route GET /api/invoices/:id/download
 * @access Private
 */
exports.downloadPdf = async (req, res) => {
  try {
    const { id } = req.params;

    // וידוא מזהה תקף
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'מזהה חשבונית לא תקין'
      });
    }

    // שליפת החשבונית
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'החשבונית לא נמצאה'
      });
    }

    // הפקת ה-PDF אם עוד לא קיים
    const fileName = `invoice_${invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
    const filePath = path.join(__dirname, '../uploads/invoices', fileName);
    
    // בדיקה אם הקובץ כבר קיים
    let pdfPath;
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        pdfPath = filePath;
      } else {
        // אם הקובץ לא קיים, ניצור אותו
        pdfPath = await generateInvoicePdf(invoice, filePath);
      }
    } catch (err) {
      // אם יש שגיאה, ניצור את הקובץ מחדש
      pdfPath = await generateInvoicePdf(invoice, filePath);
    }

    // שליחת הקובץ להורדה
    res.download(pdfPath, fileName, (err) => {
      if (err) {
        console.error('שגיאה בהורדת הקובץ:', err);
        res.status(500).json({
          success: false,
          message: 'שגיאה בהורדת הקובץ',
          error: err.message
        });
      }
    });
  } catch (error) {
    console.error('שגיאה בהורדת חשבונית:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהורדת החשבונית',
      error: error.message
    });
  }
};

// Export all controllers
module.exports = {
  createInvoice: exports.createInvoice,
  getInvoices: exports.getInvoices,
  getInvoiceById: exports.getInvoiceById,
  updateInvoice: exports.updateInvoice,
  cancelInvoice: exports.cancelInvoice,
  createCreditInvoice: exports.createCreditInvoice,
  getInvoicesByBooking: exports.getInvoicesByBooking,
  generatePdf: exports.generatePdf,
  downloadPdf: exports.downloadPdf
}; 