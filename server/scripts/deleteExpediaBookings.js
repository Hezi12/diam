const mongoose = require('mongoose');
require('dotenv').config();

// חיבור למסד הנתונים
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ התחברות למסד הנתונים הצליחה');
    } catch (error) {
        console.error('❌ שגיאה בהתחברות למסד הנתונים:', error);
        process.exit(1);
    }
};

// ייבוא המודל
const Booking = require('../models/Booking');

async function deleteExpediaBookings() {
    try {
        console.log('🔍 מחפש הזמנות Expedia קיימות...');
        
        // חיפוש הזמנות מ-Expedia
        const expediaBookings = await Booking.find({ source: 'expedia' });
        
        console.log(`📊 נמצאו ${expediaBookings.length} הזמנות מ-Expedia`);
        
        if (expediaBookings.length === 0) {
            console.log('ℹ️ אין הזמנות Expedia למחיקה');
            return;
        }
        
        // הצגת דוגמאות של ההזמנות שיימחקו
        console.log('\n📋 דוגמאות הזמנות שיימחקו:');
        expediaBookings.slice(0, 5).forEach(booking => {
            console.log(`   • הזמנה #${booking.bookingNumber}: ${booking.firstName} ${booking.lastName} (${booking.checkIn.toDateString()})`);
        });
        
        if (expediaBookings.length > 5) {
            console.log(`   ... ועוד ${expediaBookings.length - 5} הזמנות`);
        }
        
        // מחיקת ההזמנות
        console.log('\n🗑️ מוחק הזמנות Expedia...');
        const deleteResult = await Booking.deleteMany({ source: 'expedia' });
        
        console.log(`✅ נמחקו ${deleteResult.deletedCount} הזמנות מ-Expedia בהצלחה!`);
        console.log('🔄 כעת ניתן לבצע סנכרון מחדש עם השמות החדשים');
        
    } catch (error) {
        console.error('❌ שגיאה במחיקת הזמנות Expedia:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔐 חיבור למסד הנתונים נסגר');
    }
}

async function main() {
    console.log('🌍 מתחיל מחיקת הזמנות Expedia קיימות...\n');
    
    await connectDB();
    await deleteExpediaBookings();
    
    console.log('\n✨ התהליך הושלם בהצלחה!');
    console.log('💡 כעת תוכל לבצע סנכרון מחדש מהממשק כדי לראות את השמות האמיתיים');
}

main().catch(console.error);
