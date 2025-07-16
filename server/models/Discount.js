const mongoose = require('mongoose');

/**
 * מודל הנחות מתקדם
 * תומך בהנחות באחוזים ובשקלים, עם תנאים של תאריכים ורגע אחרון
 * כולל תמיכה בקופוני הנחה
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
    
    // הגדרות קופון
    couponRequired: {
      type: Boolean,
      default: false
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // אינדקס sparse - רק על מסמכים שיש להם ערך
      validate: {
        validator: function(value) {
          // אם couponRequired הוא true, צריך להיות קופון
          if (this.couponRequired && !value) {
            return false;
          }
          // אם יש קופון, צריך להיות באורך 3-20 תווים באנגלית ומספרים בלבד
          if (value && !/^[A-Z0-9]{3,20}$/.test(value)) {
            return false;
          }
          return true;
        },
        message: 'קוד קופון חייב להיות באורך 3-20 תווים, באנגלית ומספרים בלבד'
      },
      // אם יש קופון, הוא חייב להיות ייחודי
      unique: true
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
    
    // הוסר השדה priority - הלוגיקה פשוטה יותר עם combinable בלבד
    
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
      finalPrice: Number,
      couponCode: String // השדה הזה יישמר כדי לעקוב אחרי השימוש
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
DiscountSchema.index({ 'applicableRooms': 1 });
DiscountSchema.index({ 'applicableCategories': 1 });
DiscountSchema.index({ couponCode: 1 }, { sparse: true }); // אינדקס sparse על קופון

// Static Methods - פונקציות סטטיות

/**
 * חיפוש הנחה לפי קוד קופון
 */
DiscountSchema.statics.findByCouponCode = async function(couponCode) {
  if (!couponCode || typeof couponCode !== 'string') {
    return null;
  }
  
  const normalizedCode = couponCode.trim().toUpperCase();
  
  return await this.findOne({
    couponCode: normalizedCode,
    couponRequired: true,
    isActive: true
  });
};

/**
 * מציאת הנחות ישימות לפי פרמטרי הזמנה
 * תומך בקופונים ובשילוב הנחות
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
    isTourist,
    couponCode
  } = params;
  
  const now = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // אם יש קופון, נחפש הנחות קופון ואולי הנחות רגילות לשילוב
  if (couponCode) {
    const couponDiscounts = await this.findCouponDiscounts(location, couponCode);
    if (couponDiscounts.length > 0) {
      return this.processCouponDiscounts(couponDiscounts, {
        location, roomId, roomCategory, checkIn, checkOut, nights, guests, isTourist, now, checkInDate, checkOutDate
      });
    }
  }
  
  // אם אין קופון או לא נמצאו הנחות קופון, נחפש הנחות רגילות
  return this.findRegularDiscounts({
    location, roomId, roomCategory, checkIn, checkOut, nights, guests, isTourist, now, checkInDate, checkOutDate
  });
};

/**
 * חיפוש הנחות קופון
 */
DiscountSchema.statics.findCouponDiscounts = async function(location, couponCode) {
  const normalizedCode = couponCode.trim().toUpperCase();
  
  const query = {
    isActive: true,
    couponRequired: true,
    couponCode: normalizedCode,
    $or: [
      { location: location },
      { location: 'both' }
    ]
  };
  
  // סינון לפי הגבלות שימוש
  query.$or = [
    { 'usageLimit.maxUses': { $exists: false } },
    { 'usageLimit.maxUses': null },
    { $expr: { $lt: ['$usageLimit.currentUses', '$usageLimit.maxUses'] } }
  ];
  
  return this.find(query)
    .populate('applicableRooms')
    .sort({ createdAt: -1 });
};

/**
 * עיבוד הנחות קופון והחלטה על שילוב עם הנחות רגילות
 */
DiscountSchema.statics.processCouponDiscounts = async function(couponDiscounts, params) {
  const { location } = params;
  
  // סינון הנחות קופון תקפות
  const validCouponDiscounts = couponDiscounts.filter(discount => {
    return this.validateDiscountForBooking(discount, params);
  });
  
  // אם אין הנחות קופון תקפות, נחזיר רשימה ריקה
  if (validCouponDiscounts.length === 0) {
    return [];
  }
  
  // אם הנחת הקופון ניתנת לשילוב, נחפש הנחות רגילות לשילוב
  const primaryCouponDiscount = validCouponDiscounts[0];
  if (primaryCouponDiscount.combinable) {
    const combinableRegularDiscounts = await this.findCombinableRegularDiscounts(location, params);
    return [...validCouponDiscounts, ...combinableRegularDiscounts];
  }
  
  return validCouponDiscounts;
};

/**
 * חיפוש הנחות רגילות שניתן לשלב
 */
DiscountSchema.statics.findCombinableRegularDiscounts = async function(location, params) {
  const query = {
    isActive: true,
    couponRequired: { $ne: true },
    combinable: true,
    $or: [
      { location: location },
      { location: 'both' }
    ]
  };
  
  // סינון לפי הגבלות שימוש
  query.$or = [
    { 'usageLimit.maxUses': { $exists: false } },
    { 'usageLimit.maxUses': null },
    { $expr: { $lt: ['$usageLimit.currentUses', '$usageLimit.maxUses'] } }
  ];
  
  const regularDiscounts = await this.find(query)
    .populate('applicableRooms')
    .sort({ createdAt: -1 });
  
  return regularDiscounts.filter(discount => {
    return this.validateDiscountForBooking(discount, params);
  });
};

/**
 * חיפוש הנחות רגילות (ללא קופון)
 */
DiscountSchema.statics.findRegularDiscounts = async function(params) {
  const { location } = params;
  
  const query = {
    isActive: true,
    couponRequired: { $ne: true },
    $or: [
      { location: location },
      { location: 'both' }
    ]
  };
  
  // סינון לפי הגבלות שימוש
  query.$or = [
    { 'usageLimit.maxUses': { $exists: false } },
    { 'usageLimit.maxUses': null },
    { $expr: { $lt: ['$usageLimit.currentUses', '$usageLimit.maxUses'] } }
  ];
  
  const discounts = await this.find(query)
    .populate('applicableRooms')
    .sort({ createdAt: -1 });
  
  return discounts.filter(discount => {
    return this.validateDiscountForBooking(discount, params);
  });
};

/**
 * פונקציה עזר לולידציה של הנחה לפי פרמטרי הזמנה
 */
DiscountSchema.statics.validateDiscountForBooking = function(discount, params) {
  const { location, roomId, roomCategory, checkIn, checkOut, nights, guests, isTourist, now, checkInDate, checkOutDate } = params;
  
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
DiscountSchema.methods.recordUsage = async function(bookingId, discountAmount, originalPrice, finalPrice, couponCode = null) {
  // הוספה להיסטוריה
  this.usageHistory.push({
    bookingId,
    discountAmount,
    originalPrice,
    finalPrice,
    couponCode, // שמירת קוד הקופון שהשתמשו בו
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
    isTourist,
    couponCode
  } = params;
  
  // בדיקת פעילות
  if (!this.isActive) return false;
  
  // בדיקת מיקום
  if (this.location !== 'both' && this.location !== location) return false;
  
  // בדיקת הגבלת שימוש
  if (this.isUsageLimitReached) return false;
  
  // בדיקת תוקף
  if (!this.isValid) return false;
  
  // בדיקת קופון
  if (this.couponRequired) {
    if (!couponCode) return false;
    if (this.couponCode !== couponCode.trim().toUpperCase()) return false;
  }
  
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
  
  // ולידציה לקופון
  if (this.couponRequired && !this.couponCode) {
    next(new Error('הנחה שדורשת קופון חייבת לכלול קוד קופון'));
    return;
  }
  
  // נירמול קוד קופון
  if (this.couponCode) {
    this.couponCode = this.couponCode.trim().toUpperCase();
  }
  
  next();
});

module.exports = mongoose.model('Discount', DiscountSchema); 