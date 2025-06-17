const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupCounters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔄 מנקה Counters ישנים...');
    
    const db = mongoose.connection.db;
    
    // מחיקת כל הCounters שאינם bookingNumber_airport או bookingNumber_rothschild
    const result = await db.collection('counters').deleteMany({
      _id: { 
        $nin: ['bookingNumber_airport', 'bookingNumber_rothschild'] 
      }
    });
    
    console.log(`✅ נמחקו ${result.deletedCount} Counters ישנים`);
    
    // הצגת המצב הנוכחי
    const counters = await db.collection('counters').find({}).toArray();
    console.log('📊 Counters נוכחיים:');
    counters.forEach(c => console.log(`   ${c._id}: ${c.sequence_value}`));
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanupCounters(); 