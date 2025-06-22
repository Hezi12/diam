/**
 * סקריפט בדיקה לשליחת מייל
 */

require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmail() {
  console.log('🧪 בודק חיבור מייל...\n');

  // נתוני הזמנה לדוגמה
  const testBookingData = {
    bookingNumber: 9999,
    firstName: 'בדיקה',
    lastName: 'טסט',
    email: 'diamshotels@gmail.com', // שולח לעצמך
    phone: '050-123-4567',
    checkIn: new Date('2024-12-25'),
    checkOut: new Date('2024-12-27'),
    nights: 2,
    price: 400,
    roomType: 'חדר זוגי',
    roomNumber: '101',
    guests: 2,
    notes: 'זוהי הזמנה לבדיקת המערכת'
  };

  try {
    console.log('📧 שולח מיילי בדיקה...');
    
    const results = await emailService.sendBookingEmails(testBookingData);
    
    console.log('\n✅ תוצאות שליחת מיילים:');
    console.log('אישור לאורח:', results.guest.success ? '✅ נשלח' : '❌ נכשל');
    console.log('הודעה למנהל:', results.admin.success ? '✅ נשלח' : '❌ נכשל');
    
    if (!results.guest.success) {
      console.log('שגיאה באישור לאורח:', results.guest.error);
    }
    
    if (!results.admin.success) {
      console.log('שגיאה בהודעה למנהל:', results.admin.error);
    }
    
    if (results.guest.success && results.admin.success) {
      console.log('\n🎉 מערכת המיילים עובדת מושלם!');
      console.log('בדוק את התיבה של diamshotels@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ שגיאה כללית:', error.message);
  }
  
  process.exit(0);
}

// הרצה
testEmail(); 