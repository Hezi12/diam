const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { generateInvoicePdf } = require('../utils/pdfGenerator');
const PDFDocument = require('pdfkit');
const moment = require('moment');

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
    
    if (!booking.location) {
      console.error('מיקום חסר בהזמנה!');
      return res.status(400).json({
        success: false,
        message: 'מיקום חסר בהזמנה, לא ניתן ליצור חשבונית ללא מיקום'
      });
    }

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

    try {
      // ניסיון ליצור מספר חשבונית באופן ידני לפני השמירה 
      // (למקרה שהמתודה pre-save לא פועלת כראוי)
      if (!newInvoice.invoiceNumber) {
        console.log('מנסה ליצור מספר חשבונית באופן ידני');
        const { invoiceNumber, sequentialNumber } = await Invoice.generateInvoiceNumber(booking.location);
        newInvoice.invoiceNumber = invoiceNumber;
        newInvoice.sequentialNumber = sequentialNumber;
        console.log(`נוצר מספר חשבונית ידני: ${invoiceNumber}, מספר עוקב: ${sequentialNumber}`);
      }
    } catch (numError) {
      console.error('שגיאה ביצירת מספר חשבונית ידני:', numError);
      // נמשיך ונסמוך על מתודת pre-save
    }

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
 * יצירת PDF של חשבונית
 * @route GET /api/invoices/:id/pdf
 * @access Private
 */
exports.generatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    
    // בדיקת תקינות ה-ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'מזהה חשבונית לא תקין' });
    }

    // מציאת החשבונית במסד הנתונים עם המידע המלא של ההזמנה והחדר
    const invoice = await Invoice.findById(id)
      .populate({
        path: 'booking',
        populate: {
          path: 'room',
          model: 'Room'
        }
      });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'החשבונית לא נמצאה' });
    }

    try {
      // יצירת מסמך PDF
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });

      // הגדרת זרם למשלוח קובץ
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        
        // עדכון סטטוס החשבונית ל-'issued' אם היא טיוטה
        if (invoice.status === 'draft') {
          const updateInvoice = async () => {
            invoice.status = 'issued';
            invoice.issueDate = new Date();
            await invoice.save();
            console.log(`החשבונית ${invoice.invoiceNumber} עודכנה לסטטוס 'issued'`);
          };
          
          updateInvoice().catch(err => console.error('שגיאה בעדכון סטטוס החשבונית:', err));
        }

        // החזרת מידע על החשבונית והתוכן של ה-PDF ב-base64
        res.status(200).json({
          success: true,
          invoiceNumber: invoice.invoiceNumber,
          pdfData: pdfData.toString('base64')
        });
      });
      
      // הוספת תוכן החשבונית ל-PDF
      addHeader(doc, invoice);
      addInvoiceInfo(doc, invoice);
      addCustomerInfo(doc, invoice);
      addServiceDetails(doc, invoice);
      addPaymentDetails(doc, invoice);
      addFooter(doc, invoice);
      
      // סיום המסמך לאחר הוספת כל התוכן
      doc.end();
      console.log(`PDF של חשבונית ${invoice.invoiceNumber} נוצר בהצלחה`);
      
    } catch (pdfError) {
      console.error('שגיאה ביצירת PDF:', pdfError);
      return res.status(500).json({ 
        success: false, 
        message: 'שגיאה ביצירת קובץ PDF', 
        error: pdfError.message 
      });
    }
  } catch (error) {
    console.error('שגיאה כללית ביצירת PDF של חשבונית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה ביצירת PDF של חשבונית', 
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
    
    // בדיקת תקינות ה-ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'מזהה חשבונית לא תקין' });
    }

    // מציאת החשבונית במסד הנתונים עם המידע המלא של ההזמנה והחדר
    const invoice = await Invoice.findById(id)
      .populate({
        path: 'booking',
        populate: {
          path: 'room',
          model: 'Room'
        }
      });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'החשבונית לא נמצאה' });
    }

    try {
      // יצירת מסמך PDF
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });

      // הגדרת כותרות לתשובה להורדת PDF
      const fileName = `invoice_${invoice.invoiceNumber.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // חיבור זרם התשובה ל-PDF
      doc.pipe(res);
      
      // הוספת תוכן החשבונית ל-PDF
      addHeader(doc, invoice);
      addInvoiceInfo(doc, invoice);
      addCustomerInfo(doc, invoice);
      addServiceDetails(doc, invoice);
      addPaymentDetails(doc, invoice);
      addFooter(doc, invoice);
      
      // עדכון סטטוס החשבונית ל-'issued' אם היא טיוטה
      if (invoice.status === 'draft') {
        invoice.status = 'issued';
        invoice.issueDate = new Date();
        await invoice.save();
        console.log(`החשבונית ${invoice.invoiceNumber} עודכנה לסטטוס 'issued'`);
      }
      
      // סיום המסמך וסגירת הזרם
      doc.end();
      console.log(`PDF של חשבונית ${invoice.invoiceNumber} נשלח להורדה`);
      
    } catch (pdfError) {
      console.error('שגיאה ביצירת PDF להורדה:', pdfError);
      return res.status(500).json({ 
        success: false, 
        message: 'שגיאה ביצירת קובץ PDF להורדה', 
        error: pdfError.message 
      });
    }
  } catch (error) {
    console.error('שגיאה כללית בהורדת PDF של חשבונית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בהורדת PDF של חשבונית', 
      error: error.message 
    });
  }
};

// פונקציות עזר ליצירת PDF
function formatCurrency(amount) {
  return amount.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' });
}

function formatDate(dateString) {
  return moment(dateString).format('DD/MM/YYYY');
}

function formatPaymentMethod(method) {
  const methods = {
    'cash': 'מזומן',
    'credit': 'כרטיס אשראי',
    'bank': 'העברה בנקאית',
    'check': 'צ\'ק',
    'other': 'אחר'
  };
  return methods[method] || method;
}

function addHeader(doc, invoice) {
  // לוגו וכותרת החשבונית
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('DIAM APARTMENTS', { align: 'center' })
     .moveDown(0.5);
  
  doc.fontSize(14)
     .text('חשבונית מס / קבלה', { align: 'center' })
     .moveDown(1);
}

function addInvoiceInfo(doc, invoice) {
  doc.fontSize(10)
     .font('Helvetica')
     .text(`מספר חשבונית: ${invoice.invoiceNumber}`, { align: 'right' })
     .text(`תאריך הפקה: ${formatDate(invoice.issueDate || new Date())}`, { align: 'right' })
     .text(`סטטוס: ${invoice.status === 'issued' ? 'הופקה' : 'טיוטה'}`, { align: 'right' })
     .moveDown(1);
}

function addCustomerInfo(doc, invoice) {
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('פרטי לקוח:', { align: 'right' })
     .moveDown(0.5);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`שם: ${invoice.customer.name}`, { align: 'right' })
     .text(`מספר זיהוי: ${invoice.customer.idNumber || 'לא צוין'}`, { align: 'right' })
     .text(`כתובת: ${invoice.customer.address || 'לא צוינה'}`, { align: 'right' })
     .text(`טלפון: ${invoice.customer.phone || 'לא צוין'}`, { align: 'right' })
     .text(`דוא"ל: ${invoice.customer.email || 'לא צוין'}`, { align: 'right' })
     .moveDown(1);
}

function addServiceDetails(doc, invoice) {
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('פרטי השירות:', { align: 'right' })
     .moveDown(0.5);
  
  // כותרות טבלה
  let rowTop = doc.y;
  const colWidth = (doc.page.width - 100) / 4;
  
  doc.font('Helvetica-Bold')
     .text('תיאור', doc.page.width - 50 - colWidth, rowTop, { width: colWidth, align: 'right' })
     .text('תאריכים', doc.page.width - 50 - colWidth * 2, rowTop, { width: colWidth, align: 'right' })
     .text('מחיר', doc.page.width - 50 - colWidth * 3, rowTop, { width: colWidth, align: 'right' })
     .text('סכום', doc.page.width - 50 - colWidth * 4, rowTop, { width: colWidth, align: 'right' });
  
  rowTop += 20;
  doc.font('Helvetica')
     .text(`אירוח ב${invoice.booking?.room?.name || 'חדר'}`, doc.page.width - 50 - colWidth, rowTop, { width: colWidth, align: 'right' });
  
  // טווח תאריכים
  if (invoice.booking) {
    const checkIn = formatDate(invoice.booking.checkIn);
    const checkOut = formatDate(invoice.booking.checkOut);
    doc.text(`${checkIn} - ${checkOut}`, doc.page.width - 50 - colWidth * 2, rowTop, { width: colWidth, align: 'right' });
  } else {
    doc.text('לא צוין', doc.page.width - 50 - colWidth * 2, rowTop, { width: colWidth, align: 'right' });
  }
  
  // מחיר ללילה וסה"כ
  const pricePerNight = invoice.booking?.pricePerNight || 0;
  const totalAmount = invoice.totalAmount || 0;
  
  doc.text(formatCurrency(pricePerNight), doc.page.width - 50 - colWidth * 3, rowTop, { width: colWidth, align: 'right' })
     .text(formatCurrency(totalAmount), doc.page.width - 50 - colWidth * 4, rowTop, { width: colWidth, align: 'right' });
  
  // קו סיכום
  rowTop += 30;
  doc.moveTo(50, rowTop)
     .lineTo(doc.page.width - 50, rowTop)
     .stroke();
  
  // סה"כ
  rowTop += 10;
  doc.font('Helvetica-Bold')
     .text('סה"כ לתשלום:', doc.page.width - 50 - colWidth * 2, rowTop, { width: colWidth * 2, align: 'right' })
     .text(formatCurrency(totalAmount), doc.page.width - 50 - colWidth * 4, rowTop, { width: colWidth, align: 'right' });
  
  doc.moveDown(2);
}

function addPaymentDetails(doc, invoice) {
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('פרטי תשלום:', { align: 'right' })
     .moveDown(0.5);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`שיטת תשלום: ${formatPaymentMethod(invoice.paymentMethod)}`, { align: 'right' })
     .text(`סכום ששולם: ${formatCurrency(invoice.paidAmount || 0)}`, { align: 'right' })
     .text(`תאריך תשלום: ${invoice.paymentDate ? formatDate(invoice.paymentDate) : 'לא צוין'}`, { align: 'right' })
     .text(`סטטוס תשלום: ${invoice.isPaid ? 'שולם' : 'טרם שולם'}`, { align: 'right' })
     .moveDown(1);
  
  if (invoice.notes) {
    doc.fontSize(10)
       .text(`הערות: ${invoice.notes}`, { align: 'right' })
       .moveDown(1);
  }
}

function addFooter(doc, invoice) {
  const footerY = doc.page.height - 50;
  
  doc.fontSize(8)
     .font('Helvetica')
     .text('DIAM APARTMENTS | טלפון: 123-456-7890 | דוא"ל: info@diamapartments.com', 50, footerY, { align: 'center', width: doc.page.width - 100 })
     .text('© כל הזכויות שמורות - DIAM APARTMENTS', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 });
}

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