const mongoose = require('mongoose');

/**
 * סכמת מונה למספרי חשבוניות
 */
const InvoiceCounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 1 }
});

const InvoiceCounter = mongoose.model('InvoiceCounter', InvoiceCounterSchema);

/**
 * סכמת חשבונית במערכת
 */
const InvoiceSchema = new mongoose.Schema(
  {
    // מספר חשבונית (מספר עוקב + שנה)
    invoiceNumber: {
      type: String,
      unique: true,
      required: true
    },
    
    // מספר עוקב פנימי
    sequentialNumber: {
      type: Number,
      required: true
    },

    // קשר להזמנה
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    
    // מיקום (אור יהודה/רוטשילד)
    location: {
      type: String,
      enum: ['airport', 'rothschild'],
      required: true
    },
    
    // תאריך הוצאת החשבונית
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // פרטי הלקוח
    customer: {
      name: {
        type: String,
        required: true
      },
      idNumber: {
        type: String
      },
      address: {
        type: String
      },
      phone: {
        type: String
      },
      email: {
        type: String
      },
      passportNumber: {
        type: String
      }
    },
    
    // האם הלקוח הוא תייר (פטור ממע"מ)
    isTourist: {
      type: Boolean,
      default: false
    },
    
    // פרטי השירות
    serviceDetails: {
      description: {
        type: String,
        required: true
      },
      fromDate: {
        type: Date,
        required: true
      },
      toDate: {
        type: Date,
        required: true
      },
      nights: {
        type: Number,
        required: true
      },
      roomNumber: {
        type: String,
        required: true
      }
    },
    
    // פרטי תשלום
    paymentDetails: {
      subtotal: {
        type: Number,
        required: true
      },
      vatRate: {
        type: Number,
        default: 17
      },
      vatAmount: {
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
      paymentMethod: {
        type: String,
        enum: [
          'cash',
          'credit_card',
          'bank_transfer',
          'bit',
          'paybox',
          'other'
        ],
        required: true
      }
    },
    
    // סטטוס החשבונית
    status: {
      type: String,
      enum: ['draft', 'issued', 'cancelled', 'void'],
      default: 'draft'
    },
    
    // הערות
    notes: {
      type: String,
      trim: true
    },
    
    // סיבת ביטול החשבונית
    cancellationReason: {
      type: String,
      trim: true
    },
    
    // תאריך ביטול החשבונית
    cancelledAt: {
      type: Date
    },
    
    // עסקה/קבלה מקורית
    isOriginal: {
      type: Boolean,
      default: true
    },
    
    // קשור לחשבונית אחרת (למשל במקרה של ביטול/זיכוי)
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  {
    timestamps: true
  }
);

// פונקציה ליצירת מספר חשבונית עוקב
InvoiceSchema.statics.generateInvoiceNumber = async function(location) {
  const currentYear = new Date().getFullYear();
  const prefix = location === 'airport' ? 'OY' : 'RT';
  
  console.log(`מנסה ליצור מספר חשבונית למיקום: ${location}, שנה: ${currentYear}, קידומת: ${prefix}`);
  
  try {
    const counter = await InvoiceCounter.findOneAndUpdate(
      { name: `${prefix}_invoice`, year: currentYear },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    // המספר העוקב
    const sequentialNumber = counter.seq;
    console.log(`מספר עוקב שנוצר: ${sequentialNumber}`);
    
    // יצירת מספר חשבונית בפורמט LOCATION-YEAR-SEQUENCE (למשל OY-2023-00001)
    const paddedSeq = String(sequentialNumber).padStart(5, '0');
    const invoiceNumber = `${prefix}-${currentYear}-${paddedSeq}`;
    console.log(`מספר חשבונית שנוצר: ${invoiceNumber}`);
    
    return { invoiceNumber, sequentialNumber };
  } catch (error) {
    console.error('שגיאה ביצירת מספר חשבונית:', error);
    throw error;
  }
};

// וידוא שדות לפני שמירה
InvoiceSchema.pre('save', async function(next) {
  console.log('מריץ וידוא לפני שמירת חשבונית, האם יש מספר חשבונית?', !!this.invoiceNumber);
  
  // יצירת מספר חשבונית אם לא קיים
  if (!this.invoiceNumber || !this.sequentialNumber) {
    console.log('אין מספר חשבונית או מספר עוקב, מנסה ליצור');
    try {
      if (!this.location) {
        console.error('אין מיקום בחשבונית! לא ניתן ליצור מספר חשבונית');
        return next(new Error('מיקום החשבונית חסר. נדרש לציין מיקום כדי ליצור מספר חשבונית'));
      }
      
      console.log(`מיקום החשבונית: ${this.location}, מנסה ליצור מספר`);
      const { invoiceNumber, sequentialNumber } = await this.constructor.generateInvoiceNumber(this.location);
      console.log(`התקבל מספר חשבונית: ${invoiceNumber}, מספר עוקב: ${sequentialNumber}`);
      this.invoiceNumber = invoiceNumber;
      this.sequentialNumber = sequentialNumber;
      console.log('מספר חשבונית עודכן בהצלחה');
    } catch (error) {
      console.error('שגיאה בעת יצירת מספר חשבונית:', error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema); 