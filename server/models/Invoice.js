const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * סכמה של מודל חשבונית מס
 * מותאם לדרישות של רשות המיסים בישראל
 */
const InvoiceSchema = new Schema({
  // מספר חשבונית רץ וייחודי
  invoiceNumber: {
    type: String,
    required: true,
    index: { unique: true }
  },
  
  // סוג מסמך: חשבונית מס, חשבונית מס/קבלה, חשבונית זיכוי
  documentType: {
    type: String,
    enum: ['invoice', 'invoice_receipt', 'credit_invoice'],
    default: 'invoice'
  },
  
  // מצב החשבונית
  status: {
    type: String,
    enum: ['active', 'canceled', 'replaced'],
    default: 'active'
  },
  
  // מיקום החשבונית (אור יהודה או רוטשילד)
  location: {
    type: String,
    enum: ['airport', 'rothschild'],
    default: 'rothschild'
  },
  
  // תאריכים
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  
  // פרטי הלקוח
  customer: {
    name: {
      type: String,
      required: true
    },
    identifier: {
      type: String // ת.ז או ח.פ.
    },
    address: String,
    phone: String,
    email: String
  },
  
  // קשר להזמנה
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // מספר ההזמנה הקשורה (אם קיימת)
  bookingNumber: {
    type: String
  },
  
  // פרטי השירות
  items: [{
    description: {
      type: String,
      required: true
    },
    description_en: String,
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    dateRange: String,
    dateRange_en: String
  }],
  
  // סכומים
  subtotal: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 17
  },
  taxAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // פרטי תשלום
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
    default: 'cash'
  },
  paymentDetails: {
    cardLastDigits: String,
    checkNumber: String,
    bankTransferRef: String,
    otherDetails: String
  },
  
  // פרטי העסק
  business: {
    name: String,
    name_en: String,
    address: String,
    address_en: String,
    phone: String,
    email: String,
    website: String,
    taxId: String
  },
  
  // הערות
  notes: String,
  
  // קישור למסמכים שקשורים
  relatedInvoices: [{
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  
  // קישור לקובץ PDF מקורי שנשמר
  pdfUrl: String,
  
  // מידע על מערכת חיצונית (iCount)
  externalSystem: {
    name: {
      type: String,
      enum: ['internal', 'iCount'],
      default: 'internal'
    },
    invoiceId: String,       // מזהה החשבונית במערכת החיצונית
    data: Schema.Types.Mixed, // מידע נוסף שהתקבל מהמערכת החיצונית
    syncDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // מידע נוסף
  additionalData: Schema.Types.Mixed,
  
  // תיעוד יצירה ועדכון
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// הוספת אינדקסים נוספים לחיפוש יעיל
InvoiceSchema.index({ issueDate: -1 });
InvoiceSchema.index({ 'customer.name': 'text' });
InvoiceSchema.index({ booking: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ 'externalSystem.invoiceId': 1 });
InvoiceSchema.index({ 'externalSystem.name': 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema); 