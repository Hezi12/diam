const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * סכמה של מודל ממירי חדרים
 * מאפשר המרה אוטומטית מטקסט (סוג יחידת דיור) לחדרים ספציפיים
 */
const RoomMappingSchema = new Schema({
  // מיקום שאליו שייך הממיר
  location: {
    type: String,
    enum: ['airport', 'rothschild'],
    required: true
  },
  
  // טקסט לזיהוי - הטקסט שנרשם בשדה סוג יחידת דיור
  textToMatch: {
    type: String,
    required: true,
    trim: true
  },
  
  // חדר ראשי (עדיפות ראשונה)
  primaryRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  
  // מתי נוצר/עודכן
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// הוספת אינדקס על השדות location ו-textToMatch להבטחת ייחודיות
RoomMappingSchema.index({ location: 1, textToMatch: 1 }, { unique: true });

module.exports = mongoose.model('RoomMapping', RoomMappingSchema); 