const mongoose = require('mongoose');

/**
 * סכמת הזמנה במערכת
 */
const BookingSchema = new mongoose.Schema(
  {
    // מספר הזמנה עוקב
    bookingNumber: {
      type: Number,
      unique: true
    },
    
    // פרטי האורח
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: false,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    
    // פרטי ההזמנה
    checkIn: {
      type: Date,
      required: true,
      set: function(date) {
        // מוודא שאין מרכיב שעות - מאפס את השעה ל-00:00:00 UTC
        if (date) {
          const d = new Date(date);
          return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        return date;
      }
    },
    checkOut: {
      type: Date,
      required: true,
      set: function(date) {
        // מוודא שאין מרכיב שעות - מאפס את השעה ל-00:00:00 UTC
        if (date) {
          const d = new Date(date);
          return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        return date;
      }
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    roomNumber: {
      type: String
    },
    location: {
      type: String,
      enum: ['airport', 'rothschild'],
      required: true
    },
    nights: {
      type: Number,
      default: function() {
        if (this.checkIn && this.checkOut) {
          // חישוב נכון של מספר לילות ללא התחשבות בשעות
          const checkInTime = new Date(Date.UTC(
            this.checkIn.getUTCFullYear(),
            this.checkIn.getUTCMonth(),
            this.checkIn.getUTCDate()
          )).getTime();
          
          const checkOutTime = new Date(Date.UTC(
            this.checkOut.getUTCFullYear(),
            this.checkOut.getUTCMonth(),
            this.checkOut.getUTCDate()
          )).getTime();
          
          return Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
        }
        return 1;
      }
    },
    guests: {
      type: Number,
      default: 2
    },
    
    // מידע כספי
    price: {
      type: Number,
      required: true
    },
    pricePerNight: {
      type: Number
    },
    pricePerNightNoVat: {
      type: Number
    },
    discount: {
      type: Number,
      default: 0
    },
    paymentAmount: {
      type: Number,
      default: 0
    },
    
    // סטטוס
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    cleaningStatus: {
      type: String,
      enum: ['dirty', 'clean'],
      default: 'dirty'
    },
    paymentStatus: {
      type: String,
      enum: [
        'unpaid',
        'cash',
        'credit_or_yehuda',
        'credit_rothschild',
        'transfer_mizrahi',
        'bit_mizrahi',
        'paybox_mizrahi',
        'transfer_poalim',
        'bit_poalim',
        'paybox_poalim',
        'other'
      ],
      default: 'unpaid'
    },
    
    // פרטי כרטיס אשראי
    creditCard: {
      cardNumber: {
        type: String,
        trim: true
      },
      expiryDate: {
        type: String,
        trim: true
      },
      cvv: {
        type: String,
        trim: true
      }
    },
    
    // מידע נוסף
    isTourist: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    },
    
    // מעקב חוות דעת
    reviewHandled: {
      type: Boolean,
      default: false
    },
    
    // מקור ההזמנה
    source: {
      type: String,
      enum: ['direct', 'booking', 'expedia', 'airbnb', 'agoda', 'home_website', 'website', 'diam', 'airport_stay', 'rothschild_stay', 'other'],
      default: 'direct'
    },
    externalBookingNumber: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// וידוא שאין התנגשות בהזמנות באותו חדר
BookingSchema.statics.checkRoomAvailability = async function(
  roomId,
  checkIn,
  checkOut,
  bookingId = null
) {
  console.log('Checking room availability:', {
    roomId,
    checkIn: checkIn instanceof Date ? checkIn.toISOString() : checkIn,
    checkOut: checkOut instanceof Date ? checkOut.toISOString() : checkOut,
    bookingId
  });

  // נוודא שהתאריכים הם אובייקטי Date
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut);

  console.log('Converted dates:', {
    checkInDate: checkInDate.toISOString(),
    checkOutDate: checkOutDate.toISOString()
  });

  const query = {
    room: roomId,
    status: { $ne: 'cancelled' },
    $or: [
      // מקרה 1: תאריך צ'ק-אין נופל בין תאריכי הזמנה קיימת
      {
        checkIn: { $lte: checkInDate },
        checkOut: { $gt: checkInDate }
      },
      // מקרה 2: תאריך צ'ק-אאוט נופל בין תאריכי הזמנה קיימת
      {
        checkIn: { $lt: checkOutDate },
        checkOut: { $gte: checkOutDate }
      },
      // מקרה 3: ההזמנה מכילה לגמרי הזמנה קיימת
      {
        checkIn: { $gte: checkInDate },
        checkOut: { $lte: checkOutDate }
      }
    ]
  };

  // אם מדובר בעדכון הזמנה קיימת, נוציא אותה מהבדיקה
  if (bookingId) {
    query._id = { $ne: bookingId };
  }

  console.log('Room availability query:', JSON.stringify(query, null, 2));

  try {
    const existingBooking = await this.findOne(query).populate('room', 'roomNumber');
    
    if (existingBooking) {
      console.log('Found conflicting booking:', {
        bookingId: existingBooking._id,
        room: existingBooking.room ? existingBooking.room.roomNumber : 'unknown',
        checkIn: existingBooking.checkIn,
        checkOut: existingBooking.checkOut
      });
    } else {
      console.log('No conflicting bookings found, room is available');
    }
    
    return existingBooking;
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
};

// חישוב שדות נגזרים לפני שמירה
BookingSchema.pre('save', async function(next) {
  // מספר הזמנה מתנהל כעת בקונטרולרים - לא צריך יצירה אוטומטית

  // חישוב מספר לילות אם לא הוגדר
  if (!this.nights && this.checkIn && this.checkOut) {
    // השתמש בפונקציה שמתעלמת משעות ומחשבת ימים מלאים בלבד
    const checkInTime = new Date(Date.UTC(
      this.checkIn.getUTCFullYear(),
      this.checkIn.getUTCMonth(),
      this.checkIn.getUTCDate()
    )).getTime();
    
    const checkOutTime = new Date(Date.UTC(
      this.checkOut.getUTCFullYear(),
      this.checkOut.getUTCMonth(),
      this.checkOut.getUTCDate()
    )).getTime();
    
    this.nights = Math.ceil(
      (checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)
    );
  }
  
  // עדכון שדה roomNumber אם הוא ריק ויש מידע על החדר
  if (!this.roomNumber && this.room) {
    try {
      const Room = mongoose.model('Room');
      const roomDoc = await Room.findById(this.room);
      if (roomDoc) {
        this.roomNumber = roomDoc.roomNumber;
      }
    } catch (err) {
      // התעלמות משגיאות בחיפוש מספר חדר
    }
  }
  
  // חישוב מחירים עם מע"מ וללא מע"מ אם חסרים
  if (this.price && this.nights > 0) {
    if (!this.pricePerNight) {
      this.pricePerNight = Math.round(this.price / this.nights);
    }
    
    if (!this.pricePerNightNoVat) {
      // אם מדובר בתייר, אין מע"מ
      if (this.isTourist) {
        this.pricePerNightNoVat = this.pricePerNight;
      } else {
        // חישוב מחיר ללא מע"מ (מחיר עם מע"מ / 1.18)
        this.pricePerNightNoVat = Math.round((this.pricePerNight / 1.18) * 10) / 10;
      }
    }
  }
  
  next();
});

// וירטואל פילד - שם מלא
BookingSchema.virtual('guestName').get(function() {
  return this.firstName && this.lastName ? `${this.firstName} ${this.lastName}` : '';
});

// פונקציה למחיקת כל ההזמנות
BookingSchema.statics.deleteAllBookings = async function() {
  try {
    const result = await this.deleteMany({});
    return result;
  } catch (error) {
    throw new Error(`שגיאה במחיקת ההזמנות: ${error.message}`);
  }
};

module.exports = mongoose.model('Booking', BookingSchema); 