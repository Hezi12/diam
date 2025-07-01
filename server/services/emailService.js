const nodemailer = require('nodemailer');

// הגדרת Gmail transporter עם App Password
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'diamshotels@gmail.com',
      pass: 'keve iqqh runa fnld'
    }
  });
};

// תבנית מייל עברית
const getHebrewEmailTemplate = (booking, hotelName, hotelAddress) => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הזמנה</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #2196F3;
            margin-bottom: 10px;
        }
        .title {
            font-size: 1.8em;
            color: #4CAF50;
            margin: 20px 0;
        }
        .booking-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .price {
            font-size: 1.5em;
            font-weight: bold;
            color: #4CAF50;
            text-align: center;
            margin: 20px 0;
        }
        .contact-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏨 DIAM HOTELS</div>
            <h1 class="title">✅ אישור הזמנה #${booking.bookingNumber}</h1>
        </div>
        
        <p style="font-size: 1.2em;">שלום ${booking.firstName} ${booking.lastName},</p>
        
        <p>הזמנתך אושרה בהצלחה! להלן פרטי ההזמנה:</p>
        
        <div class="booking-details">
            <h3 style="color: #2196F3; margin-top: 0;">פרטי ההזמנה</h3>
            
            <div class="detail-row">
                <span class="detail-label">מלון:</span>
                <span class="detail-value">${hotelName}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">כתובת:</span>
                <span class="detail-value">${hotelAddress}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">חדר:</span>
                <span class="detail-value">חדר ${booking.roomNumber}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">תאריך כניסה:</span>
                <span class="detail-value">${new Date(booking.checkIn).toLocaleDateString('he-IL')}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">תאריך יציאה:</span>
                <span class="detail-value">${new Date(booking.checkOut).toLocaleDateString('he-IL')}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">מספר לילות:</span>
                <span class="detail-value">${booking.nights} לילות</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">מספר אורחים:</span>
                <span class="detail-value">${booking.guests} אורחים</span>
            </div>
        </div>
        
        <div class="price">
            💰 מחיר כולל: ₪${booking.price}
        </div>
        
        <div class="contact-info">
            <h3 style="color: #2196F3; margin-top: 0;">מידע ליצירת קשר</h3>
            <p><strong>📞 טלפון:</strong> 0506070260</p>
            <p><strong>📧 אימייל:</strong> diamshotels@gmail.com</p>
            <p><strong>🕐 שעות פעילות:</strong> 8:00-22:00</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">הוראות חשובות:</h4>
            <ul style="color: #856404;">
                <li>צ'ק-אין החל משעה 15:00</li>
                <li>צ'ק-אאוט עד שעה 11:00</li>
                <li>אנא הביאו תעודת זהות בעת ההגעה</li>
                <li>לביטולים - צרו קשר 24 שעות מראש</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>תודה שבחרתם בדיאם הוטלס!</p>
            <p style="font-size: 0.9em; color: #999;">
                מייל זה נשלח אוטומטיטי, אנא אל תשיבו עליו ישירות
            </p>
        </div>
    </div>
</body>
</html>`;
};

// תבנית מייל אנגלית
const getEnglishEmailTemplate = (booking, hotelName, hotelAddress) => {
  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #2196F3;
            margin-bottom: 10px;
        }
        .title {
            font-size: 1.8em;
            color: #4CAF50;
            margin: 20px 0;
        }
        .booking-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .price {
            font-size: 1.5em;
            font-weight: bold;
            color: #4CAF50;
            text-align: center;
            margin: 20px 0;
        }
        .contact-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏨 DIAM HOTELS</div>
            <h1 class="title">✅ Booking Confirmation #${booking.bookingNumber}</h1>
        </div>
        
        <p style="font-size: 1.2em;">Hello ${booking.firstName} ${booking.lastName},</p>
        
        <p>Your booking has been confirmed successfully! Here are your booking details:</p>
        
        <div class="booking-details">
            <h3 style="color: #2196F3; margin-top: 0;">Booking Details</h3>
            
            <div class="detail-row">
                <span class="detail-label">Hotel:</span>
                <span class="detail-value">${hotelName}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${hotelAddress}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Room:</span>
                <span class="detail-value">Room ${booking.roomNumber}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Check-in Date:</span>
                <span class="detail-value">${new Date(booking.checkIn).toLocaleDateString('en-US')}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Check-out Date:</span>
                <span class="detail-value">${new Date(booking.checkOut).toLocaleDateString('en-US')}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Number of Nights:</span>
                <span class="detail-value">${booking.nights} nights</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Number of Guests:</span>
                <span class="detail-value">${booking.guests} guests</span>
            </div>
        </div>
        
        <div class="price">
            💰 Total Price: ₪${booking.price}
        </div>
        
        <div class="contact-info">
            <h3 style="color: #2196F3; margin-top: 0;">Contact Information</h3>
            <p><strong>📞 Phone:</strong> +972-50-607-0260</p>
            <p><strong>📧 Email:</strong> diamshotels@gmail.com</p>
            <p><strong>🕐 Operating Hours:</strong> 8:00 AM - 10:00 PM</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">Important Instructions:</h4>
            <ul style="color: #856404;">
                <li>Check-in starts at 3:00 PM</li>
                <li>Check-out until 11:00 AM</li>
                <li>Please bring ID upon arrival</li>
                <li>For cancellations - contact us 24 hours in advance</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing Diam Hotels!</p>
            <p style="font-size: 0.9em; color: #999;">
                This email was sent automatically, please do not reply directly
            </p>
        </div>
    </div>
</body>
</html>`;
};

// פונקציה לקבלת שם המלון וכתובת לפי מיקום ושפה
const getHotelInfo = (location, language) => {
  if (location === 'airport') {
    return {
      name: language === 'en' ? 'Airport Guest House' : 'מלונית שדה התעופה',
      address: language === 'en' ? 'HaArez 12, Or Yehuda' : 'הארז 12, אור יהודה'
    };
  } else {
    return {
      name: language === 'en' ? 'Rothschild 79' : 'רוטשילד 79',
      address: language === 'en' ? 'Rothschild 79, Petah Tikva' : 'רוטשילד 79, פתח תקווה'
    };
  }
};

// פונקציה לשליחת מייל אישור הזמנה
const sendBookingConfirmation = async (booking, language = 'he') => {
  try {
    const transporter = createTransporter();
    const hotelInfo = getHotelInfo(booking.location, language);
    
    const isHebrew = language === 'he';
    const subject = isHebrew 
      ? `✅ אישור הזמנה #${booking.bookingNumber} - ${hotelInfo.name}`
      : `✅ Booking Confirmation #${booking.bookingNumber} - ${hotelInfo.name}`;
    
    const htmlContent = isHebrew 
      ? getHebrewEmailTemplate(booking, hotelInfo.name, hotelInfo.address)
      : getEnglishEmailTemplate(booking, hotelInfo.name, hotelInfo.address);
    
    const mailOptions = {
      from: 'Diam Hotels <diamshotels@gmail.com>',
      to: booking.email,
      subject: subject,
      html: htmlContent,
      replyTo: 'diamshotels@gmail.com'
    };
    
    console.log(`📧 שולח מייל אישור הזמנה ל-${booking.email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ מייל נשלח בהצלחה:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ שגיאה בשליחת מייל:', error);
    throw error;
  }
};

// פונקציה לבדיקת חיבור
const testConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ חיבור Gmail אושר בהצלחה');
    return true;
  } catch (error) {
    console.error('❌ שגיאה בחיבור Gmail:', error);
    throw error;
  }
};

// פונקציה לשליחת מייל בדיקה
const sendTestEmail = async (toEmail = 'diamshotels@gmail.com') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'Diam Hotels <diamshotels@gmail.com>',
      to: toEmail,
      subject: '🧪 בדיקת מערכת מיילים - Diam Hotels',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2196F3;">🧪 בדיקת מערכת מיילים</h2>
          <p>שלום,</p>
          <p>זהו מייל בדיקה למערכת המיילים של דיאם הוטלס.</p>
          <p>אם אתה רואה את המייל הזה - המערכת עובדת מושלם! ✅</p>
          <p>תאריך ושעה: ${new Date().toLocaleString('he-IL')}</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            🏨 דיאם הוטלס - מערכת ניהול הזמנות<br>
            📧 diamshotels@gmail.com | 📞 0506070260
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ מייל בדיקה נשלח:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ שגיאה במייל בדיקה:', error);
    throw error;
  }
};

// פונקציה ליצירת תצוגה מקדימה של מייל (לדף הבדיקה)
const generateEmailPreview = (booking, language = 'he') => {
  const hotelInfo = getHotelInfo(booking.location, language);
  const isHebrew = language === 'he';
  
  return {
    subject: isHebrew 
      ? `✅ אישור הזמנה #${booking.bookingNumber} - ${hotelInfo.name}`
      : `✅ Booking Confirmation #${booking.bookingNumber} - ${hotelInfo.name}`,
    html: isHebrew 
      ? getHebrewEmailTemplate(booking, hotelInfo.name, hotelInfo.address)
      : getEnglishEmailTemplate(booking, hotelInfo.name, hotelInfo.address)
  };
};

module.exports = {
  sendBookingConfirmation,
  testConnection,
  sendTestEmail,
  generateEmailPreview
}; 