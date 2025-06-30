const Room = require('../models/Room');
const mongoose = require('mongoose');
require('dotenv').config();

async function cleanImageDuplicates() {
  try {
    console.log('🔧 מנקה כפילות תמונות...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ מחובר למסד הנתונים');
    
    const rooms = await Room.find({location: 'rothschild'});
    console.log(`📊 מצאתי ${rooms.length} חדרים ברוטשילד`);
    
    let cleanedRooms = 0;
    let totalImagesRemoved = 0;
    
    for (const room of rooms) {
      const originalCount = room.images.length;
      
      // סינון רק התמונות התקינות (לא blob)
      const validImages = room.images.filter(img => 
        !img.includes('blob:') && img.includes('diam-loy6.onrender.com')
      );
      const removedCount = originalCount - validImages.length;
      
      if (removedCount > 0) {
        console.log(`🧹 חדר ${room.roomNumber}: הסרתי ${removedCount} תמונות לא תקינות (${originalCount} -> ${validImages.length})`);
        await Room.findByIdAndUpdate(room._id, { images: validImages });
        cleanedRooms++;
        totalImagesRemoved += removedCount;
      } else if (originalCount > 0) {
        console.log(`✅ חדר ${room.roomNumber}: ${originalCount} תמונות תקינות - לא נדרש ניקוי`);
      }
    }
    
    console.log(`\n🎯 סיכום:`);
    console.log(`- חדרים שנוקו: ${cleanedRooms}`);
    console.log(`- תמונות לא תקינות שהוסרו: ${totalImagesRemoved}`);
    console.log(`✅ ניקוי הושלם בהצלחה!`);
    
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

cleanImageDuplicates(); 