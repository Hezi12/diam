/**
 * סקריפט למחיקת כל ההזמנות הקיימות במסד הנתונים
 * שימושי לאיפוס המערכת או לצורכי בדיקה
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.join(__dirname, '../.env') });

// טעינת מודל Booking
const BookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: Number, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    location: { type: String, enum: ['airport', 'rothschild'], required: true },
    nights: { type: Number, default: 1 },
    guests: { type: Number, default: 2 },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    paymentStatus: { type: String, default: 'unpaid' }
  },
  { timestamps: true, collection: 'bookings' }
);

const Booking = mongoose.model('Booking', BookingSchema);

// חיבור למסד נתונים MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Hezi:Hezi!3225@cluster0.o8qdhf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('מתחיל תהליך מחיקת כל ההזמנות...');
console.log('מתחבר למסד הנתונים...');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('חיבור למסד הנתונים הצליח');
    
    try {
      // מחיקת כל ההזמנות - כולל גישה ישירה לאוסף
      const result = await mongoose.connection.collection('bookings').deleteMany({});
      console.log(`נמחקו ${result.deletedCount} הזמנות בהצלחה`);
    } catch (err) {
      console.error('שגיאה במחיקת ההזמנות:', err);
    }
    
    // סגירת החיבור למסד הנתונים
    await mongoose.connection.close();
    console.log('החיבור למסד הנתונים נסגר');
    
    console.log('תהליך המחיקה הסתיים');
    process.exit(0);
  })
  .catch(err => {
    console.error('שגיאה בחיבור למסד הנתונים:', err);
    process.exit(1);
  }); 