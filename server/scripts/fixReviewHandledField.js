const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת משתני סביבה
dotenv.config({ path: path.join(__dirname, '../.env') });

const Booking = require('../models/Booking');

async function fixReviewHandledField() {
  try {
    console.log('🔧 מתחיל תיקון שדה reviewHandled בהזמנות קיימות...');
    
    // חיבור למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ התחברנו למסד הנתונים');
    
    // מציאת כל ההזמנות שאין להן השדה reviewHandled או שהוא null/undefined
    const bookingsToUpdate = await Booking.find({
      $or: [
        { reviewHandled: { $exists: false } },
        { reviewHandled: null },
        { reviewHandled: undefined }
      ]
    });
    
    console.log(`📊 נמצאו ${bookingsToUpdate.length} הזמנות שצריכות עדכון`);
    
    if (bookingsToUpdate.length === 0) {
      console.log('✅ כל ההזמנות כבר מעודכנות!');
      return;
    }
    
    // עדכון כל ההזמנות
    const updateResult = await Booking.updateMany(
      {
        $or: [
          { reviewHandled: { $exists: false } },
          { reviewHandled: null },
          { reviewHandled: undefined }
        ]
      },
      {
        $set: { reviewHandled: false }
      }
    );
    
    console.log(`✅ עודכנו ${updateResult.modifiedCount} הזמנות בהצלחה!`);
    
    // בדיקה שהעדכון הצליח
    const remainingBookings = await Booking.find({
      $or: [
        { reviewHandled: { $exists: false } },
        { reviewHandled: null },
        { reviewHandled: undefined }
      ]
    });
    
    if (remainingBookings.length === 0) {
      console.log('🎉 כל ההזמנות עודכנו בהצלחה!');
    } else {
      console.log(`⚠️ נותרו ${remainingBookings.length} הזמנות שלא עודכנו`);
    }
    
  } catch (error) {
    console.error('❌ שגיאה בתיקון השדה:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 ניתקנו מהמסד נתונים');
  }
}

// הפעלת הסקריפט
if (require.main === module) {
  fixReviewHandledField().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = fixReviewHandledField; 