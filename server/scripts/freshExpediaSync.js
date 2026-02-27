const mongoose = require('mongoose');
require('dotenv').config();

// חיבור למסד הנתונים
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ התחברות למסד הנתונים הושלמה');
  } catch (error) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', error);
    process.exit(1);
  }
};

// ייבוא המודלים והשירותים
const ICalSettings = require('../models/ICalSettings');
const icalService = require('../services/icalService');

const performFreshExpediaSync = async () => {
  try {
    console.log('🌍 מתחיל סנכרון מחדש של Expedia עם שמות תקינים...\n');
    
    // קבלת הגדרות Airport (שם יש לנו את הקישורים של Expedia)
    const airportSettings = await ICalSettings.findOne({ location: 'airport' });
    
    if (!airportSettings) {
      console.log('❌ לא נמצאו הגדרות עבור Airport');
      return;
    }
    
    // בדיקת חדרים מופעלים עבור Expedia
    const expediaRooms = airportSettings.getEnabledRoomsForExpedia();
    console.log(`📊 נמצאו ${expediaRooms.length} חדרים מופעלים עבור Expedia:`);
    
    expediaRooms.forEach(room => {
      console.log(`   • חדר ${room.roomId} (${room.roomName})`);
      console.log(`     URL: ${room.expediaIcalUrl.substring(0, 50)}...`);
    });
    
    if (expediaRooms.length === 0) {
      console.log('ℹ️ אין חדרים מופעלים עבור Expedia');
      return;
    }
    
    console.log('\n🔄 מתחיל ייבוא הזמנות מ-Expedia...');
    
    // ביצוע סנכרון עבור כל חדר
    let totalNewBookings = 0;
    let successfulRooms = 0;
    let failedRooms = 0;
    
    for (const room of expediaRooms) {
      try {
        console.log(`\n🌍 מסנכרן חדר ${room.roomId} (${room.roomName})...`);
        
        const newBookings = await icalService.importExpediaCalendar(
          room.expediaIcalUrl,
          room.roomId,
          'airport'
        );
        
        console.log(`✅ חדר ${room.roomId}: ${newBookings.length} הזמנות חדשות`);
        
        // הצגת פרטי הזמנות חדשות
        if (newBookings.length > 0) {
          newBookings.forEach(booking => {
            console.log(`   👤 ${booking.firstName} ${booking.lastName} - ${booking.checkIn.toDateString()}`);
            console.log(`   🏷️ מספר חיצוני: ${booking.externalBookingNumber || 'לא זמין'}`);
          });
        }
        
        totalNewBookings += newBookings.length;
        successfulRooms++;
        
        // עדכון סטטוס הצלחה
        airportSettings.updateSyncStatus(room.roomId, 'expedia', 'success', null, newBookings.length);
        
        // המתנה בין חדרים
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ שגיאה בחדר ${room.roomId}: ${error.message}`);
        failedRooms++;
        
        // עדכון סטטוס שגיאה
        airportSettings.updateSyncStatus(room.roomId, 'expedia', 'error', error.message);
      }
    }
    
    // שמירת השינויים
    await airportSettings.save();
    
    console.log('\n🏁 סיכום סנכרון Expedia:');
    console.log(`   ✅ ${successfulRooms} חדרים בהצלחה`);
    console.log(`   ❌ ${failedRooms} חדרים נכשלו`);
    console.log(`   📥 ${totalNewBookings} הזמנות חדשות בסה"כ`);
    console.log('\n🎯 השמות עכשיו יופיעו בשדות firstName/lastName במקום רק בהערות!');
    
  } catch (error) {
    console.error('❌ שגיאה כללית בסנכרון:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 החיבור למסד הנתונים נסגר');
  }
};

// הרצת הסקריפט
const main = async () => {
  await connectDB();
  await performFreshExpediaSync();
};

main().catch(console.error);
