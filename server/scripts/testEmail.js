/**
 * סקריפט בדיקה לשליחת מייל
 */

require('dotenv').config({ path: '../.env' });
const emailService = require('../services/emailService');

async function testEmail() {
  console.log('🧪 בודק חיבור מייל...\n');
  
  const hebrewBookingData = {
    bookingNumber: 9999,
    firstName: 'אמיר',
    lastName: 'כהן',
    email: 'test@example.com',
    phone: '0506070260',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    nights: 2,
    price: 400,
    roomType: 'Standard',
    roomNumber: 'A101',
    guests: 2,
    notes: 'הערות נוספות',
    language: 'he' // 🔥 עברית
  };

  const englishBookingData = {
    bookingNumber: 9998,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phone: '0506070260',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    nights: 2,
    price: 400,
    roomType: 'Standard',
    roomNumber: 'A102',
    guests: 2,
    notes: 'Additional notes',
    language: 'en' // 🔥 אנגלית
  };

  console.log('📧 שולח מייל בעברית...');
  const hebrewResults = await emailService.sendBookingEmails(hebrewBookingData);

  console.log('\n📧 שולח מייל באנגלית...');
  const englishResults = await emailService.sendBookingEmails(englishBookingData);

  console.log('\n✅ תוצאות מיילים בעברית:');
  console.log('אישור לאורח:', hebrewResults.guest.success ? '✅ נשלח' : '❌ נכשל');
  console.log('הודעה למנהל:', hebrewResults.admin.success ? '✅ נשלח' : '❌ נכשל');

  console.log('\n✅ תוצאות מיילים באנגלית:');
  console.log('Guest confirmation:', englishResults.guest.success ? '✅ נשלח' : '❌ נכשל');
  console.log('Admin notification:', englishResults.admin.success ? '✅ נשלח' : '❌ נכשל');

  if (hebrewResults.guest.success && englishResults.guest.success) {
    console.log('\n🎉 מערכת המיילים רב-לשונית עובדת מושלם!');
    console.log('בדוק את התיבה של diamshotels@gmail.com');
  } else {
    console.log('\n❌ יש בעיה במערכת המיילים');
  }
}

testEmail().catch(console.error); 