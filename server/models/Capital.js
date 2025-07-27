const mongoose = require('mongoose');

/**
 * סכמה להיסטוריית עדכוני הון
 * מתעדת כל עדכון ידני שנעשה לסכומים ההתחלתיים
 */
const CapitalHistorySchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    required: true
  },
  previousAmount: {
    type: Number,
    required: true
  },
  newAmount: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
});

/**
 * סכמה לניהול הון
 * מנהלת את הסכומים הכוללים בכל אמצעי תשלום
 */
const CapitalSchema = new mongoose.Schema(
  {
    // מפתח ייחודי למניעת כפילויות
    key: {
      type: String,
      default: 'main',
      unique: true
    },
    
    // סכומים התחלתיים לכל אמצעי תשלום
    // אלו הסכומים שהמשתמש יכול לעדכן ידנית
    initialAmounts: {
      cash: { type: Number, default: 0 },
      cash2: { type: Number, default: 0 },
      credit_rothschild: { type: Number, default: 0 },
      credit_or_yehuda: { type: Number, default: 0 },
      transfer_poalim: { type: Number, default: 0 },
      transfer_mizrahi: { type: Number, default: 0 },
      bit_poalim: { type: Number, default: 0 },
      bit_mizrahi: { type: Number, default: 0 },
      paybox_poalim: { type: Number, default: 0 },
      paybox_mizrahi: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // סכומים מצטברים - מתעדכנים אוטומטית מהכנסות והוצאות
    currentAmounts: {
      cash: { type: Number, default: 0 },
      cash2: { type: Number, default: 0 },
      credit_rothschild: { type: Number, default: 0 },
      credit_or_yehuda: { type: Number, default: 0 },
      transfer_poalim: { type: Number, default: 0 },
      transfer_mizrahi: { type: Number, default: 0 },
      bit_poalim: { type: Number, default: 0 },
      bit_mizrahi: { type: Number, default: 0 },
      paybox_poalim: { type: Number, default: 0 },
      paybox_mizrahi: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // תאריך עדכון אחרון של הסכומים
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    // היסטוריית עדכונים
    history: [CapitalHistorySchema]
  },
  {
    timestamps: true
  }
);

/**
 * חישוב סך ההון הכולל
 * מחשב את סכום כל אמצעי התשלום (ללא אמצעי תשלום מסוימים)
 */
CapitalSchema.methods.calculateTotal = function() {
  let total = 0;
  
  // סכימת הסכומים ההתחלתיים
  for (const [method, amount] of Object.entries(this.initialAmounts)) {
    // דילוג על אמצעי תשלום שלא רוצים לכלול
    if (method === 'credit_or_yehuda' || method === 'credit_rothschild') {
      continue;
    }
    
    if (typeof amount === 'number') {
      total += amount;
    }
  }
  
  // סכימת הסכומים הנוכחיים (מהכנסות והוצאות)
  for (const [method, amount] of Object.entries(this.currentAmounts)) {
    // דילוג על אמצעי תשלום שלא רוצים לכלול
    if (method === 'credit_or_yehuda' || method === 'credit_rothschild') {
      continue;
    }
    
    if (typeof amount === 'number') {
      total += amount;
    }
  }
  
  return total;
};

/**
 * עדכון סכום התחלתי של אמצעי תשלום
 * שומר גם את ההיסטוריה של השינוי
 */
CapitalSchema.methods.updateInitialAmount = function(method, newAmount, userId = null, notes = '') {
  // שמירת הסכום הקודם להיסטוריה
  const previousAmount = this.initialAmounts[method] || 0;
  
  // עדכון הסכום החדש
  this.initialAmounts[method] = newAmount;
  
  // הוספת רשומה להיסטוריה
  this.history.push({
    paymentMethod: method,
    previousAmount,
    newAmount,
    updatedBy: userId,
    updatedAt: new Date(),
    notes
  });
  
  // עדכון תאריך העדכון האחרון
  this.lastUpdated = new Date();
  
  return this;
};

module.exports = mongoose.model('Capital', CapitalSchema); 