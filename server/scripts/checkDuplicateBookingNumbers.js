/**
 * סקריפט לבדיקת מספרי הזמנות כפולים ותיקון הבעיה
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Counter = require('../models/Counter');

async function checkDuplicateBookingNumbers() {
  try {
    // התחברות למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diam-hotel');
    console.log('🔌 התחברות למסד הנתונים הצליחה');

    // בדיקת מספרי הזמנות כפולים
    console.log('\n🔍 בודק מספרי הזמנות כפולים...');
    
    const duplicates = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingNumber',
          count: { $sum: 1 },
          bookings: { $push: { id: '$_id', firstName: '$firstName', lastName: '$lastName', checkIn: '$checkIn' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`❌ נמצאו ${duplicates.length} מספרי הזמנות כפולים:`);
      duplicates.forEach(duplicate => {
        console.log(`\n📋 מספר הזמנה ${duplicate._id} מופיע ${duplicate.count} פעמים:`);
        duplicate.bookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.firstName} ${booking.lastName} - ${booking.checkIn} (ID: ${booking.id})`);
        });
      });
    } else {
      console.log('✅ לא נמצאו מספרי הזמנות כפולים');
    }

    // בדיקת מצב הcounters
    console.log('\n🔢 בודק מצב counters...');
    const counters = await Counter.find({});
    console.log('Counters נוכחיים:');
    counters.forEach(counter => {
      console.log(`   ${counter._id}: ${counter.sequence_value}`);
    });

    // בדיקת מספר ההזמנה הגבוה ביותר בפועל
    console.log('\n📊 בודק מספר הזמנה גבוה ביותר בפועל...');
    const maxBookingNumber = await Booking.findOne({}, { bookingNumber: 1 }).sort({ bookingNumber: -1 });
    console.log(`מספר הזמנה גבוה ביותר במסד נתונים: ${maxBookingNumber ? maxBookingNumber.bookingNumber : 'אין הזמנות'}`);

    // הצעת פתרון
    if (duplicates.length > 0) {
      console.log('\n🔧 פתרונות מוצעים:');
      console.log('1. הסר את הרשומות הכפולות ידנית');
      console.log('2. עדכן את ה-counter להיות גבוה יותר מהמספר הגבוה ביותר');
      console.log('3. הרץ את הפונקציה fixDuplicateBookingNumbers() (זהירות!)');
    }

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 התנתקות מהמסד נתונים');
  }
}

async function fixDuplicateBookingNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diam-hotel');
    console.log('🔌 התחברות למסד הנתונים הצליחה');

    console.log('⚠️  מתחיל תיקון מספרי הזמנות כפולים...');
    console.log('זה יכול לקחת זמן ולשנות נתונים - המשך רק אם אתה בטוח!');

    // מצא את המספר הגבוה ביותר
    const maxBooking = await Booking.findOne({}, { bookingNumber: 1 }).sort({ bookingNumber: -1 });
    let nextNumber = maxBooking ? maxBooking.bookingNumber + 1 : 1000;

    // מצא כפילויות
    const duplicates = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingNumber',
          count: { $sum: 1 },
          bookings: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    for (const duplicate of duplicates) {
      console.log(`🔄 מתקן מספר הזמנה כפול: ${duplicate._id}`);
      
      // השאר את הראשון, עדכן את האחרים
      const bookingsToUpdate = duplicate.bookings.slice(1);
      
      for (const bookingId of bookingsToUpdate) {
        await Booking.findByIdAndUpdate(bookingId, { bookingNumber: nextNumber });
        console.log(`   ✅ עודכן booking ${bookingId} למספר ${nextNumber}`);
        nextNumber++;
      }
    }

    // עדכן את הcounters להיות גבוהים מהמספר החדש
    await Counter.findByIdAndUpdate(
      'bookingNumber_airport',
      { sequence_value: nextNumber + 100 },
      { upsert: true }
    );
    
    await Counter.findByIdAndUpdate(
      'bookingNumber_rothschild', 
      { sequence_value: nextNumber + 100 },
      { upsert: true }
    );

    console.log(`✅ תיקון הושלם. Counter עודכן ל-${nextNumber + 100}`);

  } catch (error) {
    console.error('❌ שגיאה בתיקון:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// הרצה
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'fix') {
    console.log('⚠️  אתה עומד לתקן מספרי הזמנות כפולים!');
    console.log('זה ישנה נתונים במסד! האם אתה בטוח? (Ctrl+C לביטול)');
    setTimeout(() => {
      fixDuplicateBookingNumbers();
    }, 5000);
  } else {
    checkDuplicateBookingNumbers();
  }
}

module.exports = { checkDuplicateBookingNumbers, fixDuplicateBookingNumbers }; 