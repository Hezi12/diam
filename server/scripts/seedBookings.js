/**
 * סקריפט ליצירת הזמנות לדוגמא במסד הנתונים
 * מייצר הזמנה אחת ללילה בודד עבור היום הנוכחי
 * ועוד הזמנה למספר לילות
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// מודלים
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// פונקציה להוספת מספר ימים לתאריך
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// פונקציה ליצירת הזמנות לדוגמא
const createSampleBookings = async () => {
  try {
    // התחברות למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // מציאת חדרים קיימים
    const airportRooms = await Room.find({ location: 'airport' }).limit(2);
    const rothschildRooms = await Room.find({ location: 'rothschild' }).limit(2);

    if (airportRooms.length === 0 || rothschildRooms.length === 0) {
      console.error('לא נמצאו חדרים. יש ליצור חדרים לפני הוספת הזמנות.');
      process.exit(1);
    }

    // היום הנוכחי
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // הזמנה 1: הזמנה של לילה אחד להיום
    const booking1 = {
      bookingNumber: Math.floor(Math.random() * 1000000) + 100000,
      firstName: 'ישראל',
      lastName: 'ישראלי',
      email: 'israel@example.com',
      phone: '054-1234567',
      checkIn: today,
      checkOut: addDays(today, 1),
      room: airportRooms[0]._id,
      location: 'airport',
      guests: 2,
      status: 'confirmed',
      paymentStatus: 'credit_or_yehuda',
      price: 500,
      paymentAmount: 500,
      notes: 'הזמנה לדוגמא - לילה אחד',
      nights: 1
    };

    // הזמנה 2: הזמנה של 3 לילות מחר
    const booking2 = {
      bookingNumber: Math.floor(Math.random() * 1000000) + 100000,
      firstName: 'שרה',
      lastName: 'כהן',
      email: 'sarah@example.com',
      phone: '052-9876543',
      checkIn: addDays(today, 1),
      checkOut: addDays(today, 4),
      room: rothschildRooms[0]._id,
      location: 'rothschild',
      guests: 3,
      status: 'confirmed',
      paymentStatus: 'transfer_mizrahi',
      price: 2100,
      paymentAmount: 2100,
      notes: 'הזמנה לדוגמא - מספר לילות',
      nights: 3
    };

    // מחיקת הזמנות קודמות ששימשו כדוגמא
    await Booking.deleteMany({
      $or: [
        { notes: 'הזמנה לדוגמא - לילה אחד' },
        { notes: 'הזמנה לדוגמא - מספר לילות' }
      ]
    });
    console.log('נמחקו הזמנות דוגמא קודמות');

    // יצירת ההזמנות החדשות
    const createdBooking1 = await Booking.create(booking1);
    const createdBooking2 = await Booking.create(booking2);

    console.log('=== נוצרו הזמנות לדוגמא ===');
    console.log('הזמנה 1:', createdBooking1._id);
    console.log('הזמנה 2:', createdBooking2._id);

    mongoose.connection.close();
    console.log('הסקריפט הסתיים בהצלחה');
  } catch (error) {
    console.error('שגיאה:', error);
    process.exit(1);
  }
};

// הפעלת הסקריפט
createSampleBookings(); 