const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');

// כל נתיבי המייל דורשים כעת התחברות מלאה (JWT)
router.use(auth);

// דמה של הזמנה לתצוגה מקדימה
const getSampleBooking = (location = 'airport') => {
  return {
    _id: 'sample123',
    bookingNumber: 1234,
    firstName: 'דני',
    lastName: 'כהן',
    email: 'dani.cohen@example.com',
    phone: '0501234567',
    guests: 2,
    room: 'sample-room-id',
    roomNumber: location === 'airport' ? 'A101' : 'R205',
    location: location,
    checkIn: new Date('2024-12-25'),
    checkOut: new Date('2024-12-27'),
    nights: 2,
    price: 650,
    notes: 'הזמנה לדוגמה למערכת המיילים',
    source: 'home_website',
    paymentMethod: 'credit-card',
    paymentStatus: 'unpaid',
    status: 'pending',
    isTourist: false,
    language: 'he',
    createdAt: new Date()
  };
};

// GET /api/email/preview - תצוגה מקדימה של מיילים
router.get('/preview', async (req, res) => {
  try {
    const { location = 'airport', language = 'he' } = req.query;
    
    console.log(`📧 יוצר תצוגה מקדימה: ${location} - ${language}`);
    
    const sampleBooking = getSampleBooking(location);
    sampleBooking.language = language;
    
    const emailPreview = emailService.generateEmailPreview(sampleBooking, language);
    
    res.json({
      success: true,
      preview: {
        subject: emailPreview.subject,
        html: emailPreview.html,
        booking: {
          bookingNumber: sampleBooking.bookingNumber,
          guest: `${sampleBooking.firstName} ${sampleBooking.lastName}`,
          location: sampleBooking.location,
          language: language
        }
      }
    });
  } catch (error) {
    console.error('❌ שגיאה ביצירת תצוגה מקדימה:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת תצוגה מקדימה',
      details: error.message
    });
  }
});

// POST /api/email/test - שליחת מייל בדיקה
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = email || 'diamshotels@gmail.com';
    
    console.log(`🧪 שולח מייל בדיקה ל-${targetEmail}`);
    
    const result = await emailService.sendTestEmail(targetEmail);
    
    res.json({
      success: true,
      message: `מייל בדיקה נשלח בהצלחה ל-${targetEmail}`,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ שגיאה בשליחת מייל בדיקה:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליחת מייל בדיקה',
      details: error.message
    });
  }
});

// GET /api/email/connection - בדיקת חיבור Gmail
router.get('/connection', async (req, res) => {
  try {
    console.log('🔍 בודק חיבור Gmail...');
    
    await emailService.testConnection();
    
    res.json({
      success: true,
      message: 'חיבור Gmail פעיל ותקין',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ שגיאה בחיבור Gmail:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בחיבור Gmail',
      details: error.message
    });
  }
});

// POST /api/email/send-sample - שליחת הזמנה לדוגמה
router.post('/send-sample', async (req, res) => {
  try {
    const { location = 'airport', language = 'he', email } = req.body;
    const targetEmail = email || 'diamshotels@gmail.com';
    
    console.log(`📧 שולח הזמנה לדוגמה: ${location}-${language} ל-${targetEmail}`);
    
    const sampleBooking = getSampleBooking(location);
    sampleBooking.language = language;
    sampleBooking.email = targetEmail;
    
    const result = await emailService.sendBookingConfirmation(sampleBooking, language);
    
    res.json({
      success: true,
      message: `מייל הזמנה לדוגמה נשלח ל-${targetEmail}`,
      messageId: result.messageId,
      booking: {
        bookingNumber: sampleBooking.bookingNumber,
        location: location,
        language: language
      }
    });
  } catch (error) {
    console.error('❌ שגיאה בשליחת הזמנה לדוגמה:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליחת הזמנה לדוגמה',
      details: error.message
    });
  }
});

module.exports = router; 