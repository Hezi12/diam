/**
 * סקריפט לתיקון כפילויות בהזמנות מבוקינג
 * פועל בצורה בטוחה ומזהה כפילויות לפי תאריכים ומיקום
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Booking = require('../models/Booking');

async function fixICalDuplicates() {
    try {
        console.log('🔧 מתחיל תיקון כפילויות הזמנות iCal...');
        await mongoose.connect(process.env.MONGODB_URI);

        // מציאת כפילויות
        const duplicates = await Booking.aggregate([
            { $match: { source: 'booking' } },
            {
                $group: {
                    _id: {
                        roomNumber: '$roomNumber',
                        location: '$location',
                        checkIn: '$checkIn',
                        checkOut: '$checkOut'
                    },
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`📊 נמצאו ${duplicates.length} קבוצות כפילויות`);

        let totalRemoved = 0;

        for (const duplicate of duplicates) {
            const { roomNumber, location, checkIn, checkOut } = duplicate._id;
            const docs = duplicate.docs;
            
            console.log(`\n🔍 מטפל בכפילות: חדר ${roomNumber} (${location}) | ${new Date(checkIn).toLocaleDateString('he-IL')} - ${new Date(checkOut).toLocaleDateString('he-IL')}`);
            console.log(`   נמצאו ${docs.length} הזמנות זהות`);

            // שמירת ההזמנה הראשונה (לפי תאריך יצירה)
            const sorted = docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const keepBooking = sorted[0];
            const removeBookings = sorted.slice(1);

            console.log(`   ✅ שומר הזמנה #${keepBooking.bookingNumber} (נוצרה: ${new Date(keepBooking.createdAt).toLocaleString('he-IL')})`);

            // מחיקת הכפילויות
            for (const booking of removeBookings) {
                await Booking.findByIdAndDelete(booking._id);
                console.log(`   ❌ מחק הזמנה #${booking.bookingNumber} (נוצרה: ${new Date(booking.createdAt).toLocaleString('he-IL')})`);
                totalRemoved++;
            }
        }

        console.log(`\n✅ תיקון הושלם!`);
        console.log(`📊 סטטיסטיקות:`);
        console.log(`   - קבוצות כפילויות טופלו: ${duplicates.length}`);
        console.log(`   - הזמנות נמחקו: ${totalRemoved}`);
        console.log(`   - הזמנות נשארו: ${duplicates.length}`);

        // בדיקה נוספת
        const remainingDuplicates = await Booking.aggregate([
            { $match: { source: 'booking' } },
            {
                $group: {
                    _id: {
                        roomNumber: '$roomNumber',
                        location: '$location', 
                        checkIn: '$checkIn',
                        checkOut: '$checkOut'
                    },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (remainingDuplicates.length === 0) {
            console.log('\n🎉 כל הכפילויות תוקנו בהצלחה!');
        } else {
            console.log(`\n⚠️ עדיין נותרו ${remainingDuplicates.length} כפילויות - יש צורך בבדיקה נוספת`);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ שגיאה בתיקון כפילויות:', error);
        process.exit(1);
    }
}

// הרצה
fixICalDuplicates(); 