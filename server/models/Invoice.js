/**
 * מודל חשבונית פשוט
 * משמש לשמירת רפרנס למסמכים שנוצרו ב-iCount
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  // מספר החשבונית ב-iCount
  invoiceNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // סוג המסמך
  documentType: {
    type: String,
    enum: ['invoice', 'credit_invoice', 'invoice_receipt'],
    default: 'invoice'
  },
  
  // מיקום
  location: {
    type: String,
    enum: ['airport', 'rothschild'],
    required: true
  },
  
  // הקשר להזמנה
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  // מספר ההזמנה (לנוחות החיפוש)
  bookingNumber: Number,
  
  // תאריך יצירה
  issueDate: {
    type: Date,
    default: Date.now
  },
  
  // מידע לקוח בסיסי
  customer: {
    name: String,
    identifier: String,
    email: String
  },
  
  // סכום
  amount: {
    type: Number,
    required: true
  },
  
  // עוקב אחר היצירה ב-iCount
  icountData: {
    success: Boolean,
    docNumber: String,
    paymentMethod: String,  // אמצעי התשלום לחשבונית עם קבלה
    responseData: Schema.Types.Mixed
  }
}, { timestamps: true });

// אינדקסים לחיפוש יעיל
InvoiceSchema.index({ booking: 1 });
InvoiceSchema.index({ location: 1 });
InvoiceSchema.index({ 'customer.name': 'text' });
InvoiceSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema); 