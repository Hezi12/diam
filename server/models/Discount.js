const mongoose = require('mongoose');

/**
 * מודל הנחות מתקדם
 * תומך בהנחות באחוזים ובשקלים, עם תנאים של תאריכים ורגע אחרון
 */
const DiscountSchema = new mongoose.Schema(
  {
    // פרטי הנחה בסיסיים
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    
    // סוג ההנחה
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'], // אחוזים או סכום קבוע
      required: true
    },
    
    // ערך ההנחה
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    
    // מיקום החדרים שההנחה חלה עליהם
    location: {
      type: String,
      enum: ['airport', 'rothschild', 'both'],
      required: true
    },
    
    // חדרים ספציפיים (אם ריק - כל החדרים במיקום)
    applicableRooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }],
    
    // קטגוריות חדרים (אם ריק - כל הקטגוריות)
    applicableCategories: [String],
    
    // סוג תוקף ההנחה
    validityType: {
      type: String,
      enum: ['unlimited', 'date_range', 'last_minute'],
      required: true,
      default: 'unlimited'
    },
    
    // תאריכי תוקף (לטווח תאריכים)
    validFrom: {
      type: Date,
      required: function() {
        return this.validityType === 'date_range';
      }
    },
    validUntil: {
      type: Date,
      required: function() {
        return this.validityType === 'date_range';
      }
    },
    
    // הגדרות רגע אחרון
    lastMinuteSettings: {
      daysBeforeArrival: {
        type: Number,
        default: 3,
        min: 0
      },
      includeArrivalDay: {
        type: Boolean,
        default: true
      }
    },
    
    // הגבלות ההנחה
    restrictions: {
      // מספר לילות
      minNights: {
        type: Number,
        default: 1,
        min: 1
      },
      maxNights: {
        type: Number,
        min: 1
      },
      
      // מספר אורחים
      minGuests: {
        type: Number,
        default: 1,
        min: 1
      },
      maxGuests: {
        type: Number,
        min: 1
      },
      
      // ימים בשבוע שההנחה תקפה (0=ראשון, 6=שבת)
      validDaysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      
      // האם ההנחה חלה על תיירים וישראלים
      applicableForTourists: {
        type: Boolean,
        default: true
      },
      applicableForIsraelis: {
        type: Boolean,
        default: true
      }
    },
    
    // עדיפות ההנחה (ככל שהמספר גבוה יותר, העדיפות גבוהה יותר)
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    
    // האם ניתן לשלב עם הנחות אחרות
    combinable: {
      type: Boolean,
      default: false
    },
    
    // הגבלות שימוש
    usageLimit: {
      maxUses: Number, // מספר שימושים מקסימלי
      currentUses: {
        type: Number,
        default: 0
      }
    },
    
    // היסטוריית שימוש
    usageHistory: [{
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
      },
      usedAt: {
        type: Date,
        default: Date.now
      },
      discountAmount: Number,
      originalPrice: Number,
      finalPrice: Number
    }],
    
    // סטטוס פעילות
    isActive: {
      type: Boolean,
      default: true
    },
    
    // מי יצר את ההנחה
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals - שדות מחושבים
DiscountSchema.virtual('isValid').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  switch (this.validityType) {
    case 'unlimited':
      return true;
      
    case 'date_range':
      return now >= this.validFrom && now <= this.validUntil;
      
    case 'last_minute':
      // תמיד תקף עבור רגע אחרון - הבדיקה תתבצע ברמת ההזמנה
      return true;
      
    default:
      return false;
  }
});

DiscountSchema.virtual('usagePercentage').get(function() {
  if (!this.usageLimit.maxUses) return 0;
  return Math.round((this.usageLimit.currentUses / this.usageLimit.maxUses) * 100);
});

DiscountSchema.virtual('isUsageLimitReached').get(function() {
  if (!this.usageLimit.maxUses) return false;
  return this.usageLimit.currentUses >= this.usageLimit.maxUses;
});

// Indexes לביצועים טובים
DiscountSchema.index({ location: 1, isActive: 1 });
DiscountSchema.index({ validityType: 1, validFrom: 1, validUntil: 1 });
DiscountSchema.index({ priority: -1 });
DiscountSchema.index({ 'applicableRooms': 1 });
DiscountSchema.index({ 'applicableCategories': 1 });

// Static Methods - פונקציות סטטיות

/**
 * מציאת הנחות ישימות להזמנה
 */
DiscountSchema.statics.findApplicableDiscounts = async function(params) {
  const {
    location,
    roomId,
    roomCategory,
    checkIn,
    checkOut,
    nights,
    guests,
    isTourist
  } = params;
  
  const now = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // קריטריונים בסיסיים
  const baseQuery = {
    isActive: true,
    $or: [
      { location: location },
      { location: 'both' }
    ]
  };
  
  // סינון לפי הגבלות שימוש
  baseQuery.$or = [
    { 'usageLimit.maxUses': { $exists: false } },
    { 'usageLimit.maxUses': null },
    { $expr: { $lt: ['$usageLimit.currentUses', '$usageLimit.maxUses'] } }
  ];
  
  let discounts = await this.find(baseQuery)
    .populate('applicableRooms')
    .sort({ priority: -1, createdAt: -1 });
  
  // סינון נוסף בצד הקליינט
  return discounts.filter(discount => {
    // בדיקת תוקף לפי סוג
    if (discount.validityType === 'date_range') {
      if (now < discount.validFrom || now > discount.validUntil) {
        return false;
      }
    }
    
    // בדיקת רגע אחרון
    if (discount.validityType === 'last_minute') {
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntilArrival = Math.ceil((checkInDate - now) / msPerDay);
      
      if (discount.lastMinuteSettings.includeArrivalDay) {
        if (daysUntilArrival > discount.lastMinuteSettings.daysBeforeArrival) {
          return false;
        }
      } else {
        if (daysUntilArrival >= discount.lastMinuteSettings.daysBeforeArrival) {
          return false;
        }
      }
    }
    
    // בדיקת חדרים ספציפיים
    if (discount.applicableRooms.length > 0) {
      const roomIds = discount.applicableRooms.map(room => room._id.toString());
      if (!roomIds.includes(roomId.toString())) {
        return false;
      }
    }
    
    // בדיקת קטגוריות
    if (discount.applicableCategories.length > 0) {
      if (!discount.applicableCategories.includes(roomCategory)) {
        return false;
      }
    }
    
    // בדיקת הגבלות
    const restrictions = discount.restrictions;
    
    // מספר לילות
    if (nights < restrictions.minNights) return false;
    if (restrictions.maxNights && nights > restrictions.maxNights) return false;
    
    // מספר אורחים
    if (guests < restrictions.minGuests) return false;
    if (restrictions.maxGuests && guests > restrictions.maxGuests) return false;
    
    // ימים בשבוע
    if (restrictions.validDaysOfWeek.length > 0) {
      const checkInDay = checkInDate.getDay();
      const checkOutDay = checkOutDate.getDay();
      
      // בדיקה אם יש חפיפה בין התאריכים לימים המותרים
      let hasValidDay = false;
      const currentDate = new Date(checkInDate);
      
      while (currentDate < checkOutDate) {
        if (restrictions.validDaysOfWeek.includes(currentDate.getDay())) {
          hasValidDay = true;
          break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (!hasValidDay) return false;
    }
    
    // סוג לקוח
    if (isTourist && !restrictions.applicableForTourists) return false;
    if (!isTourist && !restrictions.applicableForIsraelis) return false;
    
    return true;
  });
};

// Instance Methods - פונקציות על המופע

/**
 * חישוב סכום ההנחה
 */
DiscountSchema.methods.calculateDiscountAmount = function(originalPrice) {
  if (this.discountType === 'percentage') {
    return Math.round(originalPrice * (this.discountValue / 100));
  } else if (this.discountType === 'fixed_amount') {
    return Math.min(this.discountValue, originalPrice); // לא יותר מהמחיר המקורי
  }
  return 0;
};

/**
 * רישום שימוש בהנחה
 */
DiscountSchema.methods.recordUsage = async function(bookingId, discountAmount, originalPrice, finalPrice) {
  // הוספה להיסטוריה
  this.usageHistory.push({
    bookingId,
    discountAmount,
    originalPrice,
    finalPrice,
    usedAt: new Date()
  });
  
  // עדכון מונה השימושים
  this.usageLimit.currentUses = (this.usageLimit.currentUses || 0) + 1;
  
  await this.save();
};

/**
 * ביטול שימוש בהנחה (למקרה של ביטול הזמנה)
 */
DiscountSchema.methods.cancelUsage = async function(bookingId) {
  // הסרה מההיסטוריה
  this.usageHistory = this.usageHistory.filter(
    usage => usage.bookingId.toString() !== bookingId.toString()
  );
  
  // הפחתה ממונה השימושים
  this.usageLimit.currentUses = Math.max(0, (this.usageLimit.currentUses || 0) - 1);
  
  await this.save();
};

/**
 * בדיקה אם ההנחה ישימה להזמנה ספציפית
 */
DiscountSchema.methods.isApplicableForBooking = function(params) {
  const {
    location,
    roomId,
    roomCategory,
    checkIn,
    checkOut,
    nights,
    guests,
    isTourist
  } = params;
  
  // בדיקת פעילות
  if (!this.isActive) return false;
  
  // בדיקת מיקום
  if (this.location !== 'both' && this.location !== location) return false;
  
  // בדיקת הגבלת שימוש
  if (this.isUsageLimitReached) return false;
  
  // בדיקת תוקף
  if (!this.isValid) return false;
  
  // בדיקות נוספות יבוצעו ב-findApplicableDiscounts
  
  return true;
};

// Pre-save middleware
DiscountSchema.pre('save', function(next) {
  // ולידציה לתאריכים
  if (this.validityType === 'date_range') {
    if (this.validFrom >= this.validUntil) {
      next(new Error('תאריך הסיום חייב להיות אחרי תאריך ההתחלה'));
      return;
    }
  }
  
  // ולידציה להגבלות
  if (this.restrictions.maxNights && this.restrictions.minNights > this.restrictions.maxNights) {
    next(new Error('מספר לילות מקסימלי חייב להיות גדול מהמינימום'));
    return;
  }
  
  if (this.restrictions.maxGuests && this.restrictions.minGuests > this.restrictions.maxGuests) {
    next(new Error('מספר אורחים מקסימלי חייב להיות גדול מהמינימום'));
    return;
  }
  
  next();
});

module.exports = mongoose.model('Discount', DiscountSchema); 