/**
 * בקר למסמכים (חשבוניות)
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
    const { bookingId, documentType = 'invoice', amount } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'מזהה הזמנה חסר'
      });
    }
    
    // אימות סוג המסמך - רק חשבונית מס
    if (documentType !== 'invoice') {
      return res.status(400).json({
        success: false,
        message: 'סוג מסמך לא תקין - רק חשבונית מס נתמכת'
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
    
    // בדיקה אם כבר יש חשבונית להזמנה זו - רק לשם מידע
    const existingInvoices = await Invoice.find({
      booking: bookingId,
      documentType: 'invoice'
    });
    
    let existingInvoiceInfo = null;
    if (existingInvoices.length > 0) {
      const latestInvoice = existingInvoices[existingInvoices.length - 1];
      existingInvoiceInfo = {
        invoiceNumber: latestInvoice.invoiceNumber || latestInvoice.icountData?.docNumber,
        amount: latestInvoice.amount,
        count: existingInvoices.length
      };
      console.log(`⚠️ נמצאו ${existingInvoices.length} חשבוניות קיימות להזמנה זו. אחרונה: ${existingInvoiceInfo.invoiceNumber}`);
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
    
    // סכומים - משתמש בסכום שנשלח בדיוק (גם אם הוא 0) או בסכום מההזמנה
    const total = amount !== undefined && amount !== null ? amount : (booking.price || 0);
    
    // בדיקה האם הלקוח תייר
    const isTaxExempt = booking.isTourist === true;
    console.log(`👤 סטטוס לקוח: ${isTaxExempt ? 'תייר (פטור ממע"מ)' : 'תושב (כולל מע"מ)'}`);
    console.log(`🔍 דיבוג - booking.isTourist = ${booking.isTourist} (type: ${typeof booking.isTourist})`);
    
    // חישוב מחירים לפי סטטוס מע"מ
    let subtotal, unitPrice;
    
    if (isTaxExempt) {
      // תייר - הסכום שהוכנס הוא ללא מע"מ
      subtotal = total;
      unitPrice = total / (booking.nights || 1); // מחיר ללילה ללא מע"מ
      console.log(`💰 חשבונית לתייר: ${total} ₪ (ללא מע"מ) - unitPrice=${unitPrice} למחיר ללילה`);
    } else {
      // תושב - הסכום שהוכנס כולל מע"מ, צריך לחשב את המחיר ללא מע"מ
      subtotal = Math.round((total / 1.18) * 100) / 100; // חישוב לאחור ממחיר כולל מע"מ (מע"מ 18%)
      unitPrice = Math.round((subtotal / (booking.nights || 1)) * 100) / 100; // מחיר ללילה ללא מע"מ
      console.log(`💰 חשבונית לתושב: ${subtotal} ₪ ללא מע"מ + מע"מ = ${total} ₪ כולל - unitPrice=${unitPrice} למחיר ללילה`);
    }
    
    // הכנת פריטים לחשבונית
    const items = [{
      description: `לינה ${booking.nights} לילות (${checkInDate.toLocaleDateString('he-IL')} - ${checkOutDate.toLocaleDateString('he-IL')})`,
      quantity: booking.nights || 1,
      unitPrice: unitPrice,
      taxExempt: isTaxExempt  // 🔧 תיקון: מבוסס על סטטוס התייר
    }];
    
    console.log(`📋 נתוני פריט לחשבונית:`);
    console.log(`   - תיאור: ${items[0].description}`);
    console.log(`   - כמות: ${items[0].quantity}`);
    console.log(`   - מחיר יחידה: ${items[0].unitPrice} ₪`);
    console.log(`   - פטור ממע"מ: ${items[0].taxExempt}`);
    console.log(`   - סכום כולל: ${total} ₪`);
    
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
      'invoice'
    );
    
    if (!icountResponse || !icountResponse.success) {
      throw new Error('שגיאה ביצירת חשבונית ב-iCount');
    }
    
    // שמירת רפרנס למסמך במערכת שלנו - עם טיפול בכפילויות
    let invoice;
    
    try {
      // ניסיון ליצור חשבונית חדשה
      invoice = new Invoice({
        invoiceNumber: icountResponse.invoiceNumber,
        documentType: 'invoice',
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
      
    } catch (duplicateError) {
      // אם יש שגיאת כפילות, נעדכן את החשבונית הקיימת
      if (duplicateError.code === 11000 && duplicateError.keyPattern?.invoiceNumber) {
        console.log(`מספר חשבונית ${icountResponse.invoiceNumber} כבר קיים, מעדכן את הרשומה הקיימת`);
        
        invoice = await Invoice.findOneAndUpdate(
          { invoiceNumber: icountResponse.invoiceNumber },
          {
            documentType: 'invoice',
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
          },
          { new: true, upsert: true }
        );
      } else {
        // אם זו שגיאה אחרת, נזרוק אותה הלאה
        throw duplicateError;
      }
    }
    
    // עדכון ההזמנה עם מזהה החשבונית
    booking.invoice = invoice._id;
    await booking.save();
    
    // הכנת הודעה מתאימה
    let message = 'חשבונית נוצרה בהצלחה';
    if (existingInvoiceInfo) {
      message = `חשבונית נוצרה בהצלחה (זו חשבונית מס' ${existingInvoiceInfo.count + 1} להזמנה זו)`;
    }

    return res.status(201).json({
      success: true,
      message,
      invoice,
      icountData: icountResponse,
      existingInvoice: existingInvoiceInfo
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