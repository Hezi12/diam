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

// תבנית מייל עברית מותאמת למיילים אמיתיים
const getHebrewEmailTemplate = (booking, hotelName, hotelAddress) => {
  const isAirport = booking.location === 'airport';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הזמנה - ${hotelName}</title>
    <style>
        body {
            font-family: Arial, 'Noto Sans Hebrew', 'David', 'Times New Roman', sans-serif !important;
            line-height: 1.8 !important;
            color: #2d3748 !important;
            margin: 0 !important;
            padding: 20px !important;
            background-color: #f7fafc !important;
            direction: rtl !important;
            font-size: 16px !important;
        }
        
        .email-wrapper {
            max-width: 600px !important;
            margin: 0 auto !important;
            direction: rtl !important;
        }
        
        .container {
            background: white !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07) !important;
            border: 1px solid #e2e8f0 !important;
        }
        
        .header {
            background: #f8fafc !important;
            color: #2d3748 !important;
            padding: 30px !important;
            text-align: center !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        
        .logo {
            font-size: 26px !important;
            font-weight: bold !important;
            margin-bottom: 15px !important;
            text-align: center !important;
            color: #2d3748 !important;
        }
        
        .title {
            font-size: 22px !important;
            font-weight: bold !important;
            margin: 0 !important;
            text-align: center !important;
            color: #2d3748 !important;
        }
        
        .content {
            padding: 30px !important;
            direction: rtl !important;
            text-align: right !important;
        }
        
        .greeting {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin-bottom: 20px !important;
            text-align: center !important;
        }
        
        .intro-text {
            font-size: 17px !important;
            color: #4a5568 !important;
            text-align: center !important;
            margin-bottom: 30px !important;
            line-height: 1.8 !important;
        }
        
        .booking-card {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 25px !important;
            margin: 25px 0 !important;
            direction: rtl !important;
        }
        
        .section-title {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin: 0 0 20px 0 !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #e2e8f0 !important;
            text-align: right !important;
        }
        
        .detail-table {
            width: 100% !important;
            border-collapse: collapse !important;
            direction: rtl !important;
        }
        
        .detail-row {
            border-bottom: 1px solid #edf2f7 !important;
        }
        
        .detail-row:last-child {
            border-bottom: none !important;
        }
        
        .detail-label {
            font-weight: bold !important;
            color: #718096 !important;
            font-size: 16px !important;
            padding: 12px 0 !important;
            text-align: right !important;
            width: 40% !important;
        }
        
        .detail-value {
            font-weight: bold !important;
            color: #2d3748 !important;
            font-size: 16px !important;
            padding: 12px 0 !important;
            text-align: left !important;
            width: 60% !important;
        }
        
        .price-value {
            font-weight: bold !important;
            color: #059669 !important;
            font-size: 18px !important;
        }
        
        .info-sections {
            margin: 25px 0 !important;
            direction: rtl !important;
        }
        
        .info-section {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            direction: rtl !important;
            text-align: right !important;
        }
        
        .info-section h4 {
            color: #2d3748 !important;
            margin: 0 0 15px 0 !important;
            font-size: 18px !important;
            font-weight: bold !important;
            text-align: right !important;
        }
        
        .info-section p, .info-section ul {
            margin: 8px 0 !important;
            color: #4a5568 !important;
            line-height: 1.8 !important;
            font-size: 16px !important;
            text-align: right !important;
        }
        
        .info-section ul {
            padding-right: 20px !important;
            text-align: right !important;
        }
        
        .info-section li {
            margin: 10px 0 !important;
            font-size: 16px !important;
            text-align: right !important;
        }
        
        .contact-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 15px 0 !important;
            direction: rtl !important;
        }
        
        .contact-item {
            padding: 15px !important;
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            text-decoration: none !important;
            color: inherit !important;
            text-align: center !important;
            display: block !important;
            margin: 10px 0 !important;
        }
        
        .contact-icon {
            font-size: 24px !important;
            margin-bottom: 8px !important;
            display: block !important;
        }
        
        .contact-label {
            font-weight: bold !important;
            font-size: 16px !important;
            color: #2d3748 !important;
            margin-bottom: 5px !important;
        }
        
        .contact-number {
            font-size: 14px !important;
            color: #718096 !important;
        }
        
        .contact-note {
            margin-top: 15px !important;
            font-size: 16px !important;
            color: #718096 !important;
            text-align: center !important;
        }
        
        .footer {
            background: #f8fafc !important;
            padding: 25px !important;
            text-align: center !important;
            border-top: 1px solid #e2e8f0 !important;
            direction: rtl !important;
        }
        
        .footer-brand {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin-bottom: 10px !important;
        }
        
        .footer-text {
            color: #718096 !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
        }
        
        .social-links {
            margin: 15px 0 0 0 !important;
            text-align: center !important;
        }
        
        .social-link {
            display: inline-block !important;
            width: 40px !important;
            height: 40px !important;
            background: #2d3748 !important;
            color: white !important;
            border-radius: 6px !important;
            text-decoration: none !important;
            line-height: 40px !important;
            margin: 0 5px !important;
            font-size: 18px !important;
        }
        
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 10px !important;
            }
            
            .content {
                padding: 20px !important;
            }
            
            .header {
                padding: 20px !important;
            }
            
            .logo {
                font-size: 22px !important;
            }
            
            .title {
                font-size: 18px !important;
            }
            
            .greeting {
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">
                    ${isAirport ? 'Airport Guest House' : 'Rothschild 79'}
                </div>
                <h1 class="title">אישור הזמנה #${booking.bookingNumber}</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    שלום ${booking.firstName} ${booking.lastName}!
                </div>
                
                <div class="intro-text">
                    הזמנתך ב<strong>${hotelName}</strong> אושרה בהצלחה.<br>
                    אנחנו מצפים להגעתך.
                </div>
                
                <div class="booking-card">
                    <h3 class="section-title">פרטי ההזמנה</h3>
                    
                    <table class="detail-table">
                        <tr class="detail-row">
                            <td class="detail-label">כתובת</td>
                            <td class="detail-value">${hotelAddress}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">תאריך כניסה</td>
                            <td class="detail-value">${new Date(booking.checkIn).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">תאריך יציאה</td>
                            <td class="detail-value">${new Date(booking.checkOut).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">מספר לילות</td>
                            <td class="detail-value">${booking.nights} לילות</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">מספר אורחים</td>
                            <td class="detail-value">${booking.guests} אורחים</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">סה"כ לתשלום</td>
                            <td class="detail-value price-value">₪${booking.price}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="info-sections">
                    <div class="info-section">
                        <h4>מדיניות</h4>
                        <ul>
                            <li><strong>שעות צ'ק-אין/אאוט:</strong> צ'ק-אין משעה 15:00, צ'ק-אאוט עד שעה 10:00</li>
                            <li><strong>מדיניות ביטול:</strong> ניתן לבטל ללא עלות עד תאריך ${new Date(new Date(booking.checkIn).getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. לאחר מכן לא ניתן לבטל</li>
                            <li><strong>צ'ק-אין עצמאי:</strong> ביום ההגעה נשלח לכם את כל פרטי הצ'ק-אין</li>
                        </ul>
                    </div>
                    
                    <div class="info-section">
                        <h4>יצירת קשר</h4>
                        
                        <div class="contact-item">
                            <div class="contact-icon">📞</div>
                            <div class="contact-label">טלפון</div>
                            <div class="contact-number">050-607-0260</div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">💬</div>
                            <div class="contact-label">WhatsApp</div>
                            <div class="contact-number">צ'אט מיידי</div>
                        </div>
                        
                        <div class="contact-note">
                            <strong>לכל שאלה, שינוי או ביטול:</strong> אנא צרו קשר בטלפון, WhatsApp או הגיבו למייל זה
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-brand">
                    ${hotelName}
                </div>
                <div class="footer-text">
                    מייל זה נשלח אוטומטית ממערכת ההזמנות שלנו.<br>
                    לשאלות או בקשות, אנא צרו קשר בטלפון או WhatsApp.
                </div>
                <div class="social-links">
                    <a href="https://wa.me/972506070260" class="social-link">💬</a>
                    <a href="tel:+972506070260" class="social-link">📞</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};

// תבנית מייל אנגלית מותאמת למיילים אמיתיים
const getEnglishEmailTemplate = (booking, hotelName, hotelAddress) => {
  const isAirport = booking.location === 'airport';
  
  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - ${hotelName}</title>
    <style>
        body {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
            line-height: 1.8 !important;
            color: #2d3748 !important;
            margin: 0 !important;
            padding: 20px !important;
            background-color: #f7fafc !important;
            direction: ltr !important;
            font-size: 16px !important;
        }
        
        .email-wrapper {
            max-width: 600px !important;
            margin: 0 auto !important;
            direction: ltr !important;
        }
        
        .container {
            background: white !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07) !important;
            border: 1px solid #e2e8f0 !important;
        }
        
        .header {
            background: #f8fafc !important;
            color: #2d3748 !important;
            padding: 30px !important;
            text-align: center !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        
        .logo {
            font-size: 26px !important;
            font-weight: bold !important;
            margin-bottom: 15px !important;
            text-align: center !important;
            color: #2d3748 !important;
        }
        
        .title {
            font-size: 22px !important;
            font-weight: bold !important;
            margin: 0 !important;
            text-align: center !important;
            color: #2d3748 !important;
        }
        
        .content {
            padding: 30px !important;
            direction: ltr !important;
            text-align: left !important;
        }
        
        .greeting {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin-bottom: 20px !important;
            text-align: center !important;
        }
        
        .intro-text {
            font-size: 17px !important;
            color: #4a5568 !important;
            text-align: center !important;
            margin-bottom: 30px !important;
            line-height: 1.8 !important;
        }
        
        .booking-card {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 25px !important;
            margin: 25px 0 !important;
            direction: ltr !important;
        }
        
        .section-title {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin: 0 0 20px 0 !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #e2e8f0 !important;
            text-align: left !important;
        }
        
        .detail-table {
            width: 100% !important;
            border-collapse: collapse !important;
            direction: ltr !important;
        }
        
        .detail-row {
            border-bottom: 1px solid #edf2f7 !important;
        }
        
        .detail-row:last-child {
            border-bottom: none !important;
        }
        
        .detail-label {
            font-weight: bold !important;
            color: #718096 !important;
            font-size: 16px !important;
            padding: 12px 0 !important;
            text-align: left !important;
            width: 40% !important;
        }
        
        .detail-value {
            font-weight: bold !important;
            color: #2d3748 !important;
            font-size: 16px !important;
            padding: 12px 0 !important;
            text-align: right !important;
            width: 60% !important;
        }
        
        .price-value {
            font-weight: bold !important;
            color: #059669 !important;
            font-size: 18px !important;
        }
        
        .info-sections {
            margin: 25px 0 !important;
            direction: ltr !important;
        }
        
        .info-section {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            direction: ltr !important;
            text-align: left !important;
        }
        
        .info-section h4 {
            color: #2d3748 !important;
            margin: 0 0 15px 0 !important;
            font-size: 18px !important;
            font-weight: bold !important;
            text-align: left !important;
        }
        
        .info-section p, .info-section ul {
            margin: 8px 0 !important;
            color: #4a5568 !important;
            line-height: 1.8 !important;
            font-size: 16px !important;
            text-align: left !important;
        }
        
        .info-section ul {
            padding-left: 20px !important;
            text-align: left !important;
        }
        
        .info-section li {
            margin: 10px 0 !important;
            font-size: 16px !important;
            text-align: left !important;
        }
        
        .contact-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 15px 0 !important;
            direction: ltr !important;
        }
        
        .contact-item {
            padding: 15px !important;
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            text-decoration: none !important;
            color: inherit !important;
            text-align: center !important;
            display: block !important;
            margin: 10px 0 !important;
        }
        
        .contact-icon {
            font-size: 24px !important;
            margin-bottom: 8px !important;
            display: block !important;
        }
        
        .contact-label {
            font-weight: bold !important;
            font-size: 16px !important;
            color: #2d3748 !important;
            margin-bottom: 5px !important;
        }
        
        .contact-number {
            font-size: 14px !important;
            color: #718096 !important;
        }
        
        .contact-note {
            margin-top: 15px !important;
            font-size: 16px !important;
            color: #718096 !important;
            text-align: center !important;
        }
        
        .footer {
            background: #f8fafc !important;
            padding: 25px !important;
            text-align: center !important;
            border-top: 1px solid #e2e8f0 !important;
            direction: ltr !important;
        }
        
        .footer-brand {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin-bottom: 10px !important;
        }
        
        .footer-text {
            color: #718096 !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
        }
        
        .social-links {
            margin: 15px 0 0 0 !important;
            text-align: center !important;
        }
        
        .social-link {
            display: inline-block !important;
            width: 40px !important;
            height: 40px !important;
            background: #2d3748 !important;
            color: white !important;
            border-radius: 6px !important;
            text-decoration: none !important;
            line-height: 40px !important;
            margin: 0 5px !important;
            font-size: 18px !important;
        }
        
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 10px !important;
            }
            
            .content {
                padding: 20px !important;
            }
            
            .header {
                padding: 20px !important;
            }
            
            .logo {
                font-size: 22px !important;
            }
            
            .title {
                font-size: 18px !important;
            }
            
            .greeting {
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">
                    ${isAirport ? 'Airport Guest House' : 'Rothschild 79'}
                </div>
                <h1 class="title">Booking Confirmation #${booking.bookingNumber}</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${booking.firstName} ${booking.lastName}!
                </div>
                
                <div class="intro-text">
                    Your booking at <strong>${hotelName}</strong> has been confirmed successfully.<br>
                    We look forward to welcoming you.
                </div>
                
                <div class="booking-card">
                    <h3 class="section-title">Booking Details</h3>
                    
                    <table class="detail-table">
                        <tr class="detail-row">
                            <td class="detail-label">Address</td>
                            <td class="detail-value">${hotelAddress}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">Check-in Date</td>
                            <td class="detail-value">${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">Check-out Date</td>
                            <td class="detail-value">${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">Number of Nights</td>
                            <td class="detail-value">${booking.nights} nights</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">Number of Guests</td>
                            <td class="detail-value">${booking.guests} guests</td>
                        </tr>
                        
                        <tr class="detail-row">
                            <td class="detail-label">Total Payment</td>
                            <td class="detail-value price-value">₪${booking.price}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="info-sections">
                    <div class="info-section">
                        <h4>Policy</h4>
                        <ul>
                            <li><strong>Check-in/out Hours:</strong> Check-in from 3:00 PM, check-out until 10:00 AM</li>
                            <li><strong>Cancellation Policy:</strong> Free cancellation until ${new Date(new Date(booking.checkIn).getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. After that, cancellation is not permitted</li>
                            <li><strong>Self Check-in:</strong> Check-in details will be sent to you on the day of arrival</li>
                        </ul>
                    </div>
                    
                    <div class="info-section">
                        <h4>Contact Information</h4>
                        
                        <div class="contact-item">
                            <div class="contact-icon">📞</div>
                            <div class="contact-label">Phone</div>
                            <div class="contact-number">+972-50-607-0260</div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">💬</div>
                            <div class="contact-label">WhatsApp</div>
                            <div class="contact-number">Instant chat</div>
                        </div>
                        
                        <div class="contact-note">
                            <strong>For any questions, changes or cancellations:</strong> Please contact us by phone, WhatsApp or reply to this email
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-brand">
                    ${hotelName}
                </div>
                <div class="footer-text">
                    This email was sent automatically from our booking system.<br>
                    For questions or requests, please contact us by phone or WhatsApp.
                </div>
                <div class="social-links">
                    <a href="https://wa.me/972506070260" class="social-link">💬</a>
                    <a href="tel:+972506070260" class="social-link">📞</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};

// פונקציה לקבלת שם המלון וכתובת לפי מיקום ושפה
const getHotelInfo = (location, language) => {
  if (location === 'airport') {
    return {
      name: language === 'en' ? 'Airport Guest House' : 'בית הארחה שדה התעופה',
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
const sendBookingConfirmation = async (booking, language = 'he', isPublicBooking = false) => {
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
      from: `${hotelInfo.name} <diamshotels@gmail.com>`,
      to: booking.email,
      subject: subject,
      html: htmlContent,
      replyTo: 'diamshotels@gmail.com'
    };

    // אם זו הזמנה מהאתר הציבורי, הוסף עותק למייל הניהול
    if (isPublicBooking) {
      mailOptions.bcc = 'diamshotels@gmail.com';
      console.log(`📧 שולח מייל אישור הזמנה ל-${booking.email} + עותק לניהול`);
    } else {
      console.log(`📧 שולח מייל אישור הזמנה ל-${booking.email}`);
    }
    
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