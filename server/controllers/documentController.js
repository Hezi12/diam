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
    const { bookingId, documentType = 'invoice', amount, paymentMethod } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'מזהה הזמנה חסר'
      });
    }
    
    // אימות סוג המסמך
    if (!['invoice', 'invoice_receipt'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'סוג מסמך לא תקין - נתמכים: invoice, invoice_receipt'
      });
    }

    // אם זה חשבונית עם קבלה, נדרש אמצעי תשלום
    if (documentType === 'invoice_receipt' && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'אמצעי תשלום נדרש עבור חשבונית עם קבלה'
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

    // אם זה חשבונית עם קבלה, נפנה לפונקציה מיוחדת
    if (documentType === 'invoice_receipt') {
      return await exports.createInvoiceWithReceipt(req, res);
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
    
    console.log(`✅ הזמנה ${booking._id} עודכנה עם מזהה חשבונית`);
    
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
 * יצירת חשבונית עם קבלה
 * 
 * @param {Object} req - בקשת HTTP 
 * @param {Object} res - תגובת HTTP
 */
exports.createInvoiceWithReceipt = async (req, res) => {
  try {
    const { bookingId, paymentMethod, amount } = req.body;
    
    console.log(`📄 יוצר חשבונית עם קבלה עבור הזמנה ${bookingId} באמצעי תשלום: ${paymentMethod}`);
    
    // שליפת פרטי ההזמנה
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'הזמנה לא נמצאה'
      });
    }

    // הכנת נתוני החשבונית עם קבלה
    const invoiceAmount = amount || booking.price || 0;
    
    // בדיקה האם הלקוח תייר
    const isTaxExempt = booking.isTourist === true;
    console.log(`👤 סטטוס לקוח: ${isTaxExempt ? 'תייר (פטור ממע"מ)' : 'תושב (כולל מע"מ)'}`);
    
    // חישוב מחירים לפי סטטוס מע"מ
    let unitPrice;
    
    if (isTaxExempt) {
      // תייר - הסכום שהוכנס הוא ללא מע"מ
      unitPrice = invoiceAmount;
      console.log(`💰 חשבונית עם קבלה לתייר: ${invoiceAmount} ₪ (ללא מע"מ)`);
    } else {
      // תושב - הסכום שהוכנס כולל מע"מ, צריך לחשב את המחיר ללא מע"מ
      unitPrice = Math.round((invoiceAmount / 1.18) * 100) / 100; // חישוב לאחור ממחיר כולל מע"מ (מע"מ 18%)
      console.log(`💰 חשבונית עם קבלה לתושב: ${unitPrice} ₪ ללא מע"מ + מע"מ = ${invoiceAmount} ₪ כולל`);
    }
    
    const invoiceData = {
      customer: {
        name: `${booking.firstName} ${booking.lastName || ''}`.trim(),
        email: booking.email || 'guest@diamhotels.com',
        identifier: booking.idNumber || '',
        address: booking.address || '',
        phone: booking.phone || ''
      },
      items: [{
        description: `תשלום עבור הזמנה ${booking.bookingNumber}`,
        quantity: 1,
        unitPrice: unitPrice, // משתמש במחיר המחושב לפי סטטוס מע"מ
        taxExempt: isTaxExempt // מבוסס על סטטוס התייר
      }],
      total: isTaxExempt ? unitPrice : invoiceAmount, // לתייר - בלי מע"מ, לתושב - עם מע"מ
      paymentAmount: invoiceAmount, // הסכום שבאמת נגבה (לקבלה)
      paymentMethod: paymentMethod,
      issueDate: new Date(),
      notes: `חשבונית עם קבלה - תשלום ב${getPaymentMethodName(paymentMethod)}`
    };

    // יצירת החשבונית עם הקבלה ב-iCount
    const icountResponse = await icountService.createInvoiceWithReceipt(
      invoiceData,
      booking.location,
      paymentMethod
    );
    
    if (!icountResponse || !icountResponse.success) {
      throw new Error('שגיאה ביצירת חשבונית עם קבלה ב-iCount');
    }

    // שמירת רפרנס למסמכים במערכת שלנו
    let invoice;
    let receipt = null;
    
    try {
      // ניסיון ליצור חשבונית חדשה
      invoice = new Invoice({
        invoiceNumber: icountResponse.invoiceNumber,
        documentType: 'invoice_receipt',
        location: booking.location,
        booking: booking._id,
        bookingNumber: booking.bookingNumber,
        amount: invoiceAmount,
        customer: {
          name: invoiceData.customer.name,
          identifier: invoiceData.customer.identifier,
          email: invoiceData.customer.email
        },
        icountData: {
          success: icountResponse.success,
          docNumber: icountResponse.invoiceNumber,
          receiptNumber: icountResponse.receiptNumber,
          paymentMethod: paymentMethod,
          responseData: icountResponse.data
        }
      });

      await invoice.save();
      console.log(`✅ חשבונית נשמרה במסד הנתונים: ${invoice.invoiceNumber}`);
      
      // אם יש קבלה נפרדת, נשמור גם אותה
      if (icountResponse.receiptNumber) {
        receipt = new Invoice({
          invoiceNumber: icountResponse.receiptNumber,
          documentType: 'receipt',
          location: booking.location,
          booking: booking._id,
          bookingNumber: booking.bookingNumber,
          amount: invoiceAmount,
          customer: {
            name: invoiceData.customer.name,
            identifier: invoiceData.customer.identifier,
            email: invoiceData.customer.email
          },
          icountData: {
            success: icountResponse.success,
            docNumber: icountResponse.receiptNumber,
            invoiceNumber: icountResponse.invoiceNumber,
            paymentMethod: paymentMethod,
            responseData: icountResponse.data.receipt
          }
        });

        await receipt.save();
        console.log(`✅ קבלה נשמרה במסד הנתונים: ${receipt.invoiceNumber}`);
      }
      
    } catch (saveError) {
      console.warn('⚠️  שגיאה בשמירת המסמכים במסד הנתונים:', saveError.message);
      // לא נכשיל את כל התהליך בגלל שגיאת שמירה
      invoice = {
        invoiceNumber: icountResponse.invoiceNumber,
        documentType: 'invoice_receipt',
        amount: invoiceAmount,
        icountData: icountResponse
      };
    }

    const responseMessage = icountResponse.receiptNumber 
      ? `חשבונית (${icountResponse.invoiceNumber}) וקבלה (${icountResponse.receiptNumber}) נוצרו בהצלחה`
      : icountResponse.message || 'חשבונית נוצרה בהצלחה';
    
    console.log(`✅ ${responseMessage}`);
    
    // הזמנה עודכנה אוטומטית עם מזהה החשבונית בשלבים הקודמים
    console.log(`✅ חשבונית עם קבלה נוצרה בהצלחה להזמנה ${bookingId}`);
    
    return res.status(201).json({
      success: true,
      message: responseMessage,
      invoice,
      receipt,
      icountData: icountResponse
    });

  } catch (error) {
    console.error('שגיאה ביצירת חשבונית עם קבלה:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת חשבונית עם קבלה',
      error: error.message
    });
  }
};

/**
 * פונקציה עזר לקבלת שם אמצעי התשלום בעברית
 */
function getPaymentMethodName(paymentMethod) {
  const names = {
    'cash': 'מזומן',
    'credit_card': 'אשראי',
    'bit': 'ביט',
    'bank_transfer': 'העברה בנקאית'
  };
  return names[paymentMethod] || paymentMethod;
}

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