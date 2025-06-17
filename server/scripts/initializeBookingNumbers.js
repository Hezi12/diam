const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');
const Counter = require('../models/Counter');

// טעינת הגדרות סביבה
dotenv.config();

// התחברות למסד הנתונים
mongoose.connect(process.env.MONGODB_URI);

async function initializeBookingNumbers() {
  try {
    console.log('🔄 מאתחל מספרי הזמנות...');
    
    // מציאת המספר הגבוה ביותר לכל מיקום
    const locations = ['airport', 'rothschild'];
    
    for (const location of locations) {
      console.log(`\n📍 בודק מיקום: ${location}`);
      
      // מציאת ההזמנה עם המספר הגבוה ביותר במיקום זה
      const lastBooking = await Booking.findOne({ location })
        .sort({ bookingNumber: -1 })
        .limit(1);
      
      if (lastBooking) {
        const maxNumber = lastBooking.bookingNumber;
        console.log(`   ✅ מספר הזמנה גבוה ביותר: ${maxNumber}`);
        
        // עדכון או יצירת Counter עבור המיקום הזה
        const counterKey = `bookingNumber_${location}`;
        await Counter.findByIdAndUpdate(
          counterKey,
          { sequence_value: maxNumber },
          { upsert: true }
        );
        
        console.log(`   ✅ Counter עודכן: ${counterKey} = ${maxNumber}`);
      } else {
        console.log(`   ⚠️  לא נמצאו הזמנות במיקום ${location}`);
        
        // אתחול Counter עם 999 (הבא יהיה 1000)
        const counterKey = `bookingNumber_${location}`;
        await Counter.findByIdAndUpdate(
          counterKey,
          { sequence_value: 999 },
          { upsert: true }
        );
        
        console.log(`   ✅ Counter אותחל: ${counterKey} = 999`);
      }
    }
    
    console.log('\n🎉 אתחול הושלם בהצלחה!');
    console.log('\n📊 סיכום Counters:');
    
    const counters = await Counter.find({});
    counters.forEach(counter => {
      console.log(`   ${counter._id}: ${counter.sequence_value}`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה באתחול:', error);
  } finally {
    mongoose.disconnect();
  }
}

// הרצת הסקריפט
initializeBookingNumbers(); 