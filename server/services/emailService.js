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

// תבנית מייל עברית נקייה
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
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Heebo', 'Arial', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 20px;
            background-color: #f7fafc;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
        }
        
        .header {
            background: #f8fafc;
            color: #2d3748;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .logo {
            font-size: 1.8em;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .logo-icon {
            font-size: 1.1em;
        }
        
        .logo-text {
            font-weight: 600;
            letter-spacing: -0.3px;
        }
        
        .title {
            font-size: 1.3em;
            font-weight: 500;
            margin: 0;
            opacity: 0.95;
        }
        
        .content {
            padding: 30px;
        }
        
        .greeting {
            font-size: 1.2em;
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .intro-text {
            font-size: 1em;
            color: #4a5568;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .booking-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 25px;
            margin: 25px 0;
        }
        
        .section-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .detail-grid {
            display: grid;
            gap: 12px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #edf2f7;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 500;
            color: #718096;
            font-size: 0.95em;
        }
        
        .detail-value {
            font-weight: 600;
            color: #2d3748;
            text-align: left;
        }
        
        .price-highlight {
            background: #2d3748;
            color: white;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin: 25px 0;
        }
        
        .price-amount {
            font-size: 2em;
            font-weight: 700;
            margin: 0 0 5px 0;
        }
        
        .price-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .info-sections {
            margin: 25px 0;
        }
        
        .info-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .info-section h4 {
            color: #2d3748;
            margin: 0 0 15px 0;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .info-section p, .info-section ul {
            margin: 8px 0;
            color: #4a5568;
            line-height: 1.6;
        }
        
        .info-section ul {
            padding-right: 20px;
        }
        
        .info-section li {
            margin: 8px 0;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s ease;
        }
        
        .contact-item:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }
        
        .contact-icon {
            width: 35px;
            height: 35px;
            background: #2d3748;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.1em;
        }
        
        .footer {
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-brand {
            font-size: 1.2em;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .footer-text {
            color: #718096;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .social-links {
            margin: 15px 0 0 0;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        
        .social-link {
            width: 35px;
            height: 35px;
            background: #2d3748;
            color: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .social-link:hover {
            background: #4a5568;
        }
        
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }
            
            .content {
                padding: 20px;
            }
            
            .header {
                padding: 20px;
            }
            
            .logo {
                font-size: 1.5em;
            }
            
            .title {
                font-size: 1.1em;
            }
            
            .price-amount {
                font-size: 1.8em;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">
                    <span class="logo-text">${isAirport ? 'Airport Guest House' : 'Rothschild 79'}</span>
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
                    
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">כתובת</span>
                            <span class="detail-value">${hotelAddress}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">תאריך כניסה</span>
                            <span class="detail-value">${new Date(booking.checkIn).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">תאריך יציאה</span>
                            <span class="detail-value">${new Date(booking.checkOut).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">מספר לילות</span>
                            <span class="detail-value">${booking.nights} לילות</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">מספר אורחים</span>
                            <span class="detail-value">${booking.guests} אורחים</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">סה"כ לתשלום</span>
                            <span class="detail-value" style="font-weight: 700; color: #059669;">₪${booking.price}</span>
                        </div>
                    </div>
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
                        <div class="contact-grid">
                            <a href="tel:+972506070260" class="contact-item">
                                <div class="contact-icon" style="background: #2563eb;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">טלפון</div>
                                    <div style="font-size: 0.9em; color: #718096;">050-607-0260</div>
                                </div>
                            </a>
                            <a href="https://wa.me/972506070260" class="contact-item">
                                <div class="contact-icon" style="background: #25d366;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">WhatsApp</div>
                                    <div style="font-size: 0.9em; color: #718096;">צ'אט מיידי</div>
                                </div>
                            </a>
                        </div>
                        <p style="margin-top: 15px; font-size: 0.9em; color: #718096;">
                            <strong>לכל שאלה, שינוי או ביטול:</strong> אנא צרו קשר בטלפון, WhatsApp או הגיבו למייל זה
                        </p>
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

// תבנית מייל אנגלית נקייה
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Arial', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 20px;
            background-color: #f7fafc;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
        }
        
        .header {
            background: #f8fafc;
            color: #2d3748;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .logo {
            font-size: 1.8em;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .logo-icon {
            font-size: 1.1em;
        }
        
        .logo-text {
            font-weight: 600;
            letter-spacing: -0.3px;
        }
        
        .title {
            font-size: 1.3em;
            font-weight: 500;
            margin: 0;
            opacity: 0.95;
        }
        
        .content {
            padding: 30px;
        }
        
        .greeting {
            font-size: 1.2em;
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .intro-text {
            font-size: 1em;
            color: #4a5568;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .booking-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 25px;
            margin: 25px 0;
        }
        
        .section-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .detail-grid {
            display: grid;
            gap: 12px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #edf2f7;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 500;
            color: #718096;
            font-size: 0.95em;
        }
        
        .detail-value {
            font-weight: 600;
            color: #2d3748;
            text-align: right;
        }
        
        .price-highlight {
            background: #2d3748;
            color: white;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin: 25px 0;
        }
        
        .price-amount {
            font-size: 2em;
            font-weight: 700;
            margin: 0 0 5px 0;
        }
        
        .price-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .info-sections {
            margin: 25px 0;
        }
        
        .info-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .info-section h4 {
            color: #2d3748;
            margin: 0 0 15px 0;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .info-section p, .info-section ul {
            margin: 8px 0;
            color: #4a5568;
            line-height: 1.6;
        }
        
        .info-section ul {
            padding-left: 20px;
        }
        
        .info-section li {
            margin: 8px 0;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s ease;
        }
        
        .contact-item:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }
        
        .contact-icon {
            width: 35px;
            height: 35px;
            background: #2d3748;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.1em;
        }
        
        .footer {
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-brand {
            font-size: 1.2em;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .footer-text {
            color: #718096;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .social-links {
            margin: 15px 0 0 0;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        
        .social-link {
            width: 35px;
            height: 35px;
            background: #2d3748;
            color: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .social-link:hover {
            background: #4a5568;
        }
        
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }
            
            .content {
                padding: 20px;
            }
            
            .header {
                padding: 20px;
            }
            
            .logo {
                font-size: 1.5em;
            }
            
            .title {
                font-size: 1.1em;
            }
            
            .price-amount {
                font-size: 1.8em;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">
                    <span class="logo-text">${isAirport ? 'Airport Guest House' : 'Rothschild 79'}</span>
                </div>
                <h1 class="title">Booking Confirmation #${booking.bookingNumber}</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${booking.firstName} ${booking.lastName}!
                </div>
                
                <div class="intro-text">
                    Your booking at <strong>${hotelName}</strong> has been confirmed successfully.<br>
                    We look forward to your arrival.
                </div>
                
                <div class="booking-card">
                    <h3 class="section-title">Booking Details</h3>
                    
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Address</span>
                            <span class="detail-value">${hotelAddress}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Check-in Date</span>
                            <span class="detail-value">${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Check-out Date</span>
                            <span class="detail-value">${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Number of Nights</span>
                            <span class="detail-value">${booking.nights} nights</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Number of Guests</span>
                            <span class="detail-value">${booking.guests} guests</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Total Payment</span>
                            <span class="detail-value" style="font-weight: 700; color: #059669;">₪${booking.price}</span>
                        </div>
                    </div>
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
                        <div class="contact-grid">
                            <a href="tel:+972506070260" class="contact-item">
                                <div class="contact-icon" style="background: #2563eb;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">Phone</div>
                                    <div style="font-size: 0.9em; color: #718096;">+972-50-607-0260</div>
                                </div>
                            </a>
                            <a href="https://wa.me/972506070260" class="contact-item">
                                <div class="contact-icon" style="background: #25d366;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">WhatsApp</div>
                                    <div style="font-size: 0.9em; color: #718096;">Instant chat</div>
                                </div>
                            </a>
                        </div>
                        <p style="margin-top: 15px; font-size: 0.9em; color: #718096;">
                            <strong>For any questions, changes or cancellations:</strong> Please contact us by phone, WhatsApp or reply to this email
                        </p>
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