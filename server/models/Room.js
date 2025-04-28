const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    // פרטי חדר בסיסיים
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      enum: ['airport', 'rothschild'],
      required: true
    },
    category: {
      type: String,
      enum: ['Simple', 'Simple with Balcony', 'Standard', 'Standard with Balcony', 'Family room', 'Not for Sale'],
      required: true
    },
    
    // פרטי מחירים
    basePrice: {
      type: Number,
      required: true
    },
    vatPrice: {
      type: Number,
      required: true
    },
    fridayPrice: {
      type: Number,
      default: function() { return this.basePrice; }
    },
    fridayVatPrice: {
      type: Number,
      default: function() { return this.vatPrice; }
    },
    
    // פרטי תפוסה
    baseOccupancy: {
      type: Number,
      default: 2
    },
    maxOccupancy: {
      type: Number,
      default: 2
    },
    extraGuestCharge: {
      type: Number,
      default: 0
    },
    
    // מידע תיאורי
    description: {
      type: String,
      default: ''
    },
    amenities: {
      type: [String],
      default: []
    },
    
    // תמונות
    images: {
      type: [String],
      default: []
    },
    
    // סטטוס פעילות
    status: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// תיקוף נתונים נוספים
RoomSchema.pre('save', function(next) {
  // וידוא שמספר האורחים המקסימלי לא קטן ממספר האורחים הבסיסי
  if (this.maxOccupancy < this.baseOccupancy) {
    this.maxOccupancy = this.baseOccupancy;
  }
  
  // חישוב מע"מ אם חסר
  if (this.basePrice && !this.vatPrice) {
    this.vatPrice = parseFloat((this.basePrice * 1.18).toFixed(2));
  }
  
  if (this.fridayPrice && !this.fridayVatPrice) {
    this.fridayVatPrice = parseFloat((this.fridayPrice * 1.18).toFixed(2));
  }
  
  next();
});

module.exports = mongoose.model('Room', RoomSchema); 