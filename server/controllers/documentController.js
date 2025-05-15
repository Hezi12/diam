/**
 * בקר למסמכים (חשבוניות, חשבוניות-קבלה, ואישורי הזמנה)
 */

const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const icountService = require('../services/icountService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * יצירת מסמך עבור הזמנה
 * 
 * @param {Object} req - בקשת HTTP 
 * @param {Object} res - תגובת HTTP
 */
exports.createDocument = async (req, res) => {
  try {
    const { bookingId, documentType = 'invoice' } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'מזהה הזמנה חסר'
      });
    }
    
    // אימות סוג המסמך
    if (!['invoice', 'invoice_receipt', 'confirmation'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'סוג מסמך לא תקין'
      });
    }
    
    // שליפת פרטי ההזמנה
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'הזמנה לא נמצאה'
      });
    }
    
    // אם זה אישור הזמנה, טפל בו בנפרד (לא קשור ל-iCount)
    if (documentType === 'confirmation') {
      return await createBookingConfirmation(req, res, booking);
    }
    
    // בדיקה אם כבר יש חשבונית מאותו סוג להזמנה זו
    const existingInvoice = await Invoice.findOne({
      booking: bookingId,
      documentType: documentType
    });
    
    if (existingInvoice) {
      return res.status(200).json({
        success: true,
        message: 'כבר קיימת חשבונית להזמנה זו',
        invoice: existingInvoice
      });
    }
    
    // הכנת נתוני לקוח
    const customer = {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      identifier: booking.idNumber || '',
      email: booking.email || '',
      phone: booking.phone || ''
    };
    
    // חישוב תאריכים בפורמט מקומי
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    // הכנת פריטים לחשבונית
    const items = [{
      description: `לינה ${booking.nights} לילות (${checkInDate.toLocaleDateString('he-IL')} - ${checkOutDate.toLocaleDateString('he-IL')})`,
      quantity: booking.nights || 1,
      unitPrice: booking.pricePerNightNoVat || (booking.price / (booking.nights * 1.17)),
      taxExempt: false
    }];
    
    // סכומים
    const total = booking.price || 0;
    const subtotal = total / 1.17; // חישוב לאחור ממחיר כולל מע"מ
    
    // הכנת נתוני החשבונית ל-iCount
    const invoiceData = {
      customer,
      items,
      total,
      subtotal,
      paymentMethod: booking.paymentStatus && booking.paymentStatus.startsWith('credit') ? 'credit_card' : 'cash',
      issueDate: new Date(),
      notes: `הזמנה מספר: ${booking.bookingNumber}`
    };
    
    // יצירת חשבונית ב-iCount
    const icountResponse = await icountService.createInvoice(
      invoiceData,
      booking.location,
      documentType
    );
    
    if (!icountResponse || !icountResponse.success) {
      throw new Error('שגיאה ביצירת חשבונית ב-iCount');
    }
    
    // שמירת רפרנס למסמך במערכת שלנו
    const invoice = new Invoice({
      invoiceNumber: icountResponse.invoiceNumber,
      documentType,
      location: booking.location,
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      customer: {
        name: customer.name,
        identifier: customer.identifier,
        email: customer.email
      },
      amount: total,
      icountData: {
        success: true,
        docNumber: icountResponse.invoiceNumber,
        responseData: icountResponse.data
      }
    });
    
    await invoice.save();
    
    // עדכון ההזמנה עם מזהה החשבונית
    booking.invoice = invoice._id;
    await booking.save();
    
    return res.status(201).json({
      success: true,
      message: 'מסמך נוצר בהצלחה',
      invoice,
      icountData: icountResponse
    });
    
  } catch (error) {
    console.error('שגיאה ביצירת מסמך:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת מסמך',
      error: error.message
    });
  }
};

/**
 * יצירת אישור הזמנה (לא קשור ל-iCount)
 * 
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 * @param {Object} booking - נתוני ההזמנה
 */
async function createBookingConfirmation(req, res, booking) {
  try {
    // שמירת רפרנס למסמך במערכת שלנו
    const invoice = new Invoice({
      invoiceNumber: `CONF-${booking.bookingNumber}`,
      documentType: 'confirmation',
      location: booking.location,
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      customer: {
        name: `${booking.firstName} ${booking.lastName}`.trim(),
        email: booking.email
      },
      amount: booking.price || 0,
      icountData: {
        success: true,
        docNumber: `CONF-${booking.bookingNumber}`
      }
    });
    
    await invoice.save();
    
    // יצירת PDF פשוט של אישור הזמנה
    const pdfPath = path.join(__dirname, '..', 'uploads', 'invoices', `confirmation-${booking.bookingNumber}.pdf`);
    
    // וודא שהתיקייה קיימת
    const dir = path.dirname(pdfPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // יצירת ה-PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // שמירה לקובץ
    doc.pipe(fs.createWriteStream(pdfPath));
    
    // הוספת תוכן
    doc.font('Helvetica-Bold').fontSize(20).text('אישור הזמנה', { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(14).text(`מספר הזמנה: ${booking.bookingNumber}`, { align: 'right' });
    doc.font('Helvetica').fontSize(14).text(`שם האורח: ${booking.firstName} ${booking.lastName}`, { align: 'right' });
    doc.font('Helvetica').fontSize(14).text(`תאריך צ'ק-אין: ${new Date(booking.checkIn).toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.font('Helvetica').fontSize(14).text(`תאריך צ'ק-אאוט: ${new Date(booking.checkOut).toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.font('Helvetica').fontSize(14).text(`מספר לילות: ${booking.nights}`, { align: 'right' });
    doc.font('Helvetica').fontSize(14).text(`מחיר כולל: ${booking.price} ₪`, { align: 'right' });
    
    // סיום
    doc.end();
    
    return res.status(201).json({
      success: true,
      message: 'אישור הזמנה נוצר בהצלחה',
      invoice,
      pdfPath: `/api/documents/pdf/${invoice._id}`
    });
  } catch (error) {
    console.error('שגיאה ביצירת אישור הזמנה:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת אישור הזמנה',
      error: error.message
    });
  }
}

/**
 * קבלת מסמך לפי מזהה
 * 
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.getDocumentById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('booking');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'מסמך לא נמצא'
      });
    }
    
    return res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('שגיאה בקבלת מסמך:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה בקבלת מסמך',
      error: error.message
    });
  }
};

/**
 * בדיקת חיבור ל-iCount
 * 
 * @param {Object} req - בקשת HTTP
 * @param {Object} res - תגובת HTTP
 */
exports.checkICountConnection = async (req, res) => {
  try {
    const { location = 'rothschild' } = req.query;
    const result = await icountService.checkConnection(location);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת חיבור ל-iCount',
      error: error.message
    });
  }
}; 