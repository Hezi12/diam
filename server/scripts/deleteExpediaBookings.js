const mongoose = require('mongoose');
require('dotenv').config();

// חיבור למסד הנתונים
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ התחברות למסד הנתונים הושלמה');
  } catch (error) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', error);
    process.exit(1);
  }
};

// ייבוא המודלים
const Booking = require('../models/Booking');

const deleteExpediaBookings = async () => {
  try {
    console.log('🗑️ מתחיל מחיקת כל הזמנות Expedia...');
    
    // חיפוש הזמנות Expedia
    const expediaBookings = await Booking.find({ source: 'expedia' });
    console.log(`📊 נמצאו ${expediaBookings.length} הזמנות Expedia למחיקה`);
    
    if (expediaBookings.length === 0) {
      console.log('ℹ️ אין הזמנות Expedia למחיקה');
      return;
    }
    
    // הצגת פירוט ההזמנות שימחקו
    console.log('\n📋 רשימת הזמנות למחיקה:');
    expediaBookings.forEach((booking, index) => {
      console.log(`${index + 1}. הזמנה #${booking.bookingNumber} - ${booking.firstName} ${booking.lastName} - חדר ${booking.roomNumber} - ${booking.checkIn.toDateString()}`);
    });
    
    // מחיקת כל הזמנות Expedia
    const result = await Booking.deleteMany({ source: 'expedia' });
    
    console.log(`\n✅ נמחקו ${result.deletedCount} הזמנות Expedia בהצלחה!`);
    console.log('🔄 כעת ניתן לבצע סנכרון מחדש עם השמות התקינים');
    
  } catch (error) {
    console.error('❌ שגיאה במחיקת הזמנות Expedia:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 החיבור למסד הנתונים נסגר');
  }
};

// הרצת הסקריפט
const main = async () => {
  await connectDB();
  await deleteExpediaBookings();
};

main().catch(console.error);
