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
    const {
      booking: bookingId,
      customer,
      isTourist,
      notes,
      paymentDetails
    } = req.body;

    // וידוא שקיימת הזמנה תקפה
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'ההזמנה לא נמצאה' });
    }

    // חישוב ערכים לפי נתוני ההזמנה
    const subtotal = booking.isTourist ? booking.price : (booking.price / 1.17).toFixed(2);
    const vatAmount = booking.isTourist ? 0 : (booking.price - subtotal).toFixed(2);

    // יצירת אובייקט החשבונית
    const newInvoice = new Invoice({
      booking: bookingId,
      location: booking.location,
      isTourist: isTourist || booking.isTourist,
      customer: {
        name: customer?.name || `${booking.firstName} ${booking.lastName}`,
        phone: customer?.phone || booking.phone,
        email: customer?.email || booking.email,
        idNumber: customer?.idNumber,
        address: customer?.address,
        passportNumber: customer?.passportNumber || (booking.isTourist ? 'תייר' : '')
      },
      serviceDetails: {
        description: `לינה ${booking.location === 'airport' ? 'באור יהודה' : 'ברוטשילד'}`,
        fromDate: booking.checkIn,
        toDate: booking.checkOut,
        nights: booking.nights,
        roomNumber: booking.roomNumber || (booking.room?.roomNumber || '')
      },
      paymentDetails: {
        subtotal: paymentDetails?.subtotal || parseFloat(subtotal),
        vatRate: booking.isTourist ? 0 : 17,
        vatAmount: paymentDetails?.vatAmount || parseFloat(vatAmount),
        discount: paymentDetails?.discount || booking.discount || 0,
        total: paymentDetails?.total || booking.price,
        paymentMethod: paymentDetails?.paymentMethod || mapBookingPaymentToInvoicePayment(booking.paymentStatus)
      },
      notes: notes
    });

    // שמירת החשבונית
    await newInvoice.save();

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
      error: error.message
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
      .populate('booking', 'bookingNumber firstName lastName checkIn checkOut')
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

    // הפקת ה-PDF
    const outputPath = path.join(__dirname, '../uploads/invoices', `invoice_${invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`);
    const pdfPath = await generateInvoicePdf(invoice, outputPath);

    // שינוי סטטוס החשבונית ל-issued אם היא בסטטוס draft
    if (invoice.status === 'draft') {
      invoice.status = 'issued';
      await invoice.save();
    }

    // החזרת נתיב הקובץ
    res.status(200).json({
      success: true,
      data: {
        pdfPath: pdfPath.replace(/^.*\/uploads/, '/uploads'), // המרה לנתיב יחסי לשרת
        invoiceNumber: invoice.invoiceNumber
      },
      message: 'החשבונית הופקה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בהפקת חשבונית PDF:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהפקת חשבונית PDF',
      error: error.message
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