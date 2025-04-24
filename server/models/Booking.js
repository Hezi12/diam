const mongoose = require('mongoose');

/**
 * סכמת הזמנה במערכת
 */
const BookingSchema = new mongoose.Schema(
  {
    // פרטי האורח
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
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
      required: true
    },
    checkOut: {
      type: Date,
      required: true
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
          return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
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
      cardholderName: {
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
    
    // מקור ההזמנה
    source: {
      type: String,
      enum: ['direct', 'booking', 'expedia', 'airbnb', 'agoda', 'other'],
      default: 'direct'
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
  const query = {
    room: roomId,
    status: { $ne: 'cancelled' },
    $or: [
      // מקרה 1: תאריך צ'ק-אין נופל בין תאריכי הזמנה קיימת
      {
        checkIn: { $lte: checkIn },
        checkOut: { $gt: checkIn }
      },
      // מקרה 2: תאריך צ'ק-אאוט נופל בין תאריכי הזמנה קיימת
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gte: checkOut }
      },
      // מקרה 3: ההזמנה מכילה לגמרי הזמנה קיימת
      {
        checkIn: { $gte: checkIn },
        checkOut: { $lte: checkOut }
      }
    ]
  };

  // אם מדובר בעדכון הזמנה קיימת, נוציא אותה מהבדיקה
  if (bookingId) {
    query._id = { $ne: bookingId };
  }

  const existingBooking = await this.findOne(query).populate('room', 'roomNumber');

  return existingBooking;
};

// חישוב שדות נגזרים לפני שמירה
BookingSchema.pre('save', async function(next) {
  // חישוב מספר לילות אם לא הוגדר
  if (!this.nights && this.checkIn && this.checkOut) {
    this.nights = Math.ceil(
      (this.checkOut.getTime() - this.checkIn.getTime()) / (1000 * 60 * 60 * 24)
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

module.exports = mongoose.model('Booking', BookingSchema); 