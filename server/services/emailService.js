/**
 * שירות מיילים למערכת דיאם
 * מטפל בשליחת מיילים להזמנות ציבוריות
 */

const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { he, enUS } = require('date-fns/locale');

class EmailService {
  constructor() {
    this.transporter = null;
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@diamshotels.com';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@diamshotels.com';
    this.setupTransporter();
  }

  /**
   * הגדרת transporter לשליחת מיילים
   */
  setupTransporter() {
    try {
      // תמיכה במספר ספקי מייל
      if (process.env.EMAIL_PROVIDER === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD // App Password, לא סיסמה רגילה
          }
        });
      } else if (process.env.EMAIL_PROVIDER === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // ברירת מחדל - Ethereal לטסטים
        console.log('⚠️ לא הוגדר ספק מייל, משתמש ב-Ethereal לטסטים');
        this.setupEtherealTransporter().catch(error => {
          console.error('שגיאה בהגדרת Ethereal:', error);
        });
      }
    } catch (error) {
      console.error('שגיאה בהגדרת transporter:', error);
    }
  }

  /**
   * הגדרת Ethereal לטסטים (מייל דמה)
   */
  async setupEtherealTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Ethereal Test Account:', testAccount.user);
    } catch (error) {
      console.error('שגיאה בהגדרת Ethereal:', error);
    }
  }

       /**
   * יצירת תבנית HTML לאישור הזמנה לאורח - בעברית
   */
  createGuestConfirmationTemplateHE(bookingData) {
     // עיצוב תאריכים בעברית (fallback אם יש בעיה עם locale)
     let checkInFormatted, checkOutFormatted;
     try {
       checkInFormatted = format(new Date(bookingData.checkIn), 'EEEE, d בMMMM yyyy', { locale: he });
       checkOutFormatted = format(new Date(bookingData.checkOut), 'EEEE, d בMMMM yyyy', { locale: he });
     } catch (error) {
       // fallback למקרה שיש בעיה עם ה-locale
       checkInFormatted = format(new Date(bookingData.checkIn), 'dd/MM/yyyy');
       checkOutFormatted = format(new Date(bookingData.checkOut), 'dd/MM/yyyy');
     }
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הזמנה - Airport Guest House</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: white; 
            color: #1e293b; 
            padding: 30px 30px 20px 30px; 
            text-align: center; 
            border-bottom: 1px solid #e2e8f0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 600;
            color: #1e293b;
        }
        .header .subtitle { 
            margin: 8px 0 0; 
            font-size: 16px; 
            color: #64748b;
            font-weight: 400;
        }
        .content { 
            padding: 30px; 
        }
        .booking-number { 
            text-align: center; 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 25px;
            border: 1px solid #bfdbfe;
        }
        .booking-number h2 { 
            color: #1e40af; 
            margin: 0; 
            font-size: 22px;
            font-weight: 700;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .detail-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-right: 4px solid #1e40af;
        }
        .detail-card h3 { 
            margin: 0 0 10px; 
            color: #1e40af; 
            font-size: 16px;
            text-align: right;
        }
        .detail-card p { 
            margin: 5px 0; 
            color: #64748b;
            text-align: right;
        }
        .price-summary { 
            background: #0071e3; 
            color: white; 
            padding: 25px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0;
        }
        .price-summary h3 { 
            margin: 0 0 10px; 
            font-size: 18px;
        }
        .price-summary .amount { 
            font-size: 32px; 
            font-weight: bold; 
        }
        .instructions { 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            border-right: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .instructions h3 { 
            color: #1e40af; 
            margin: 0 0 10px;
            text-align: right;
        }
        .contact-info { 
            text-align: center; 
            padding: 20px; 
            background: #f8fafc; 
            border-top: 1px solid #e2e8f0;
        }
        .contact-info a { 
            color: #0071e3; 
            text-decoration: none;
        }
        @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 50px; color: #059669; margin-bottom: 15px;">✅</div>
            <h1>ההזמנה התקבלה בהצלחה!</h1>
            <p class="subtitle">Airport Guest House</p>
        </div>
        
        <div class="content">
            <div class="booking-number">
                <h2>מספר הזמנה: ${String(bookingData.bookingNumber).padStart(6, '0')}</h2>
            </div>
            
            <div class="details-grid">
                <div class="detail-card">
                    <h3>תאריכי שהייה</h3>
                    <p><strong>צ'ק-אין:</strong> ${checkInFormatted}</p>
                    <p><strong>צ'ק-אאוט:</strong> ${checkOutFormatted}</p>
                    <p><strong>מספר לילות:</strong> ${bookingData.nights}</p>
                </div>
                
                <div class="detail-card">
                    <h3>פרטי החדר</h3>
                    <p><strong>סוג חדר:</strong> ${bookingData.roomType}</p>
                    <p><strong>מספר חדר:</strong> ${bookingData.roomNumber}</p>
                    <p><strong>מספר אורחים:</strong> ${bookingData.guests}</p>
                </div>
                
                <div class="detail-card">
                    <h3>סכום לתשלום</h3>
                    <p style="color: #1e40af; font-size: 20px; font-weight: bold;">${bookingData.price} ₪</p>
                </div>
            </div>
            
            <div class="instructions">
                <h3>הוראות חשובות</h3>
                <ul style="margin: 10px 0; padding-left: 20px; text-align: right; direction: rtl;">
                    <li>צ'ק-אין החל מהשעה 15:00</li>
                    <li>צ'ק-אאוט עד השעה 10:00</li>
                    <li>יש לנו צ'ק-אין עצמאי - ביום ההגעה נשלח את כל הפרטים והוראות הכניסה באמצעות WhatsApp</li>
                </ul>
            </div>
            
            <div class="instructions">
                <h3>מדיניות ביטול</h3>
                <ul style="margin: 10px 0; padding-left: 20px; text-align: right; direction: rtl;">
                    <li>ביטול ללא עלות עד 3 ימים לפני הגעה</li>
                    <li>לאחר מכן לא ניתן לבטל</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0; padding: 25px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
                <p style="color: #1e293b; text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                    אם יש שאלות או צורך בעזרה, אנו כאן בשבילכם
                </p>
                <p style="text-align: center; margin: 0;">
                    📱 <a href="https://wa.me/972506070260" style="color: #25d366; text-decoration: none; font-weight: 700; font-size: 20px;">WhatsApp</a> <span style="font-size: 18px; color: #64748b; font-weight: 600;">- לכל שינוי או ביטול</span>
                </p>
            </div>
        </div>
        
        <div class="contact-info">
            <p><strong>Airport Guest House</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

     /**
    * יצירת תבנית HTML להודעה למנהל
    */
   createAdminNotificationTemplate(bookingData) {
     // עיצוב תאריכים בעברית (fallback אם יש בעיה עם locale)
     let checkInFormatted, checkOutFormatted;
     try {
       checkInFormatted = format(new Date(bookingData.checkIn), 'EEEE, d בMMMM yyyy', { locale: he });
       checkOutFormatted = format(new Date(bookingData.checkOut), 'EEEE, d בMMMM yyyy', { locale: he });
     } catch (error) {
       checkInFormatted = format(new Date(bookingData.checkIn), 'dd/MM/yyyy');
       checkOutFormatted = format(new Date(bookingData.checkOut), 'dd/MM/yyyy');
     }
     const now = format(new Date(), 'dd/MM/yyyy HH:mm');
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הזמנה חדשה מהאתר</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
        }
        .content { 
            padding: 30px; 
        }
        .alert { 
            background: #fef2f2; 
            border: 2px solid #dc2626; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            margin-bottom: 20px;
        }
        .booking-details { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-right: 4px solid #0071e3;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
        .priority { 
            background: #dc2626; 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 הזמנה חדשה מהאתר הציבורי</h1>
            <p>התקבלה ב-${now}</p>
        </div>
        
        <div class="content">
            <div class="alert">
                <h2 style="margin: 0; color: #dc2626;">פעולה נדרשת!</h2>
                <p style="margin: 10px 0 0;">הזמנה חדשה התקבלה דרך האתר הציבורי</p>
            </div>
            
            <div class="booking-details">
                <h3 style="margin: 0 0 15px; color: #0071e3;">פרטי ההזמנה</h3>
                
                <div class="detail-row">
                    <span class="label">מספר הזמנה:</span>
                    <span class="value">${String(bookingData.bookingNumber).padStart(6, '0')}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">שם האורח:</span>
                    <span class="value">${bookingData.firstName} ${bookingData.lastName}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">טלפון:</span>
                    <span class="value">${bookingData.phone}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">אימייל:</span>
                    <span class="value">${bookingData.email}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">צ'ק-אין:</span>
                    <span class="value">${checkInFormatted}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">צ'ק-אאוט:</span>
                    <span class="value">${checkOutFormatted}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">לילות:</span>
                    <span class="value">${bookingData.nights}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">חדר:</span>
                    <span class="value">${bookingData.roomType} - חדר ${bookingData.roomNumber}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">אורחים:</span>
                    <span class="value">${bookingData.guests}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">מחיר:</span>
                    <span class="value">${bookingData.price} ₪</span>
                </div>
                
                ${bookingData.language ? `
                <div class="detail-row">
                    <span class="label">שפת הלקוח:</span>
                    <span class="value">${bookingData.language === 'en' ? 'אנגלית' : 'עברית'}</span>
                </div>
                ` : ''}
                
                ${bookingData.notes ? `
                <div class="detail-row">
                    <span class="label">הערות:</span>
                    <span class="value">${bookingData.notes}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="priority">
                <h3 style="margin: 0 0 10px;">פעולות נדרשות:</h3>
                <ul style="text-align: right; margin: 0; padding-right: 20px;">
                    <li>בדיקת זמינות החדר במערכת</li>
                    <li>אישור ההזמנה במערכת הפנימית</li>
                    <li>הכנת החדר לקראת הגעת האורח</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * יצירת תבנית HTML לאישור הזמנה לאורח - באנגלית
   */
  createGuestConfirmationTemplateEN(bookingData) {
    // Format dates in English
    let checkInFormatted, checkOutFormatted;
    try {
      checkInFormatted = format(new Date(bookingData.checkIn), 'EEEE, MMMM d, yyyy', { locale: enUS });
      checkOutFormatted = format(new Date(bookingData.checkOut), 'EEEE, MMMM d, yyyy', { locale: enUS });
    } catch (error) {
      // fallback in case of locale issues
      checkInFormatted = format(new Date(bookingData.checkIn), 'MM/dd/yyyy');
      checkOutFormatted = format(new Date(bookingData.checkOut), 'MM/dd/yyyy');
    }

    return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Airport Guest House</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: white; 
            color: #1e293b; 
            padding: 30px 30px 20px 30px; 
            text-align: center; 
            border-bottom: 1px solid #e2e8f0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 600;
            color: #1e293b;
        }
        .header .subtitle { 
            margin: 8px 0 0; 
            font-size: 16px; 
            color: #64748b;
            font-weight: 400;
        }
        .content { 
            padding: 30px; 
        }
        .booking-number { 
            text-align: center; 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 25px;
            border: 1px solid #bfdbfe;
        }
        .booking-number h2 { 
            color: #1e40af; 
            margin: 0; 
            font-size: 22px;
            font-weight: 700;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .detail-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #1e40af;
        }
        .detail-card h3 { 
            margin: 0 0 10px; 
            color: #1e40af; 
            font-size: 16px;
            text-align: left;
        }
        .detail-card p { 
            margin: 5px 0; 
            color: #64748b;
            text-align: left;
        }
        .instructions { 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .instructions h3 { 
            color: #1e40af; 
            margin: 0 0 10px;
            text-align: left;
        }
        ul { text-align: left; direction: ltr; }
        .contact-info { 
            text-align: center; 
            padding: 20px; 
            background: #f8fafc; 
            border-top: 1px solid #e2e8f0;
        }
        .contact-info a { 
            color: #0071e3; 
            text-decoration: none;
        }
        @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 50px; color: #059669; margin-bottom: 15px;">✅</div>
            <h1>Booking Confirmed!</h1>
            <p class="subtitle">Airport Guest House</p>
        </div>
        
        <div class="content">
            <div class="booking-number">
                <h2>Booking Number: ${String(bookingData.bookingNumber).padStart(6, '0')}</h2>
            </div>
            
            <div class="details-grid">
                <div class="detail-card">
                    <h3>Stay Dates</h3>
                    <p><strong>Check-in:</strong> ${checkInFormatted}</p>
                    <p><strong>Check-out:</strong> ${checkOutFormatted}</p>
                    <p><strong>Number of nights:</strong> ${bookingData.nights}</p>
                </div>
                
                <div class="detail-card">
                    <h3>Room Details</h3>
                    <p><strong>Room type:</strong> ${bookingData.roomType}</p>
                    <p><strong>Room number:</strong> ${bookingData.roomNumber}</p>
                    <p><strong>Number of guests:</strong> ${bookingData.guests}</p>
                </div>
                
                <div class="detail-card">
                    <h3>Total Amount</h3>
                    <p style="color: #1e40af; font-size: 20px; font-weight: bold;">₪${bookingData.price}</p>
                </div>
            </div>
            
            <div class="instructions">
                <h3>Important Instructions</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Check-in from 3:00 PM</li>
                    <li>Check-out until 10:00 AM</li>
                    <li>We have self check-in - on arrival day we will send all details and entry instructions via WhatsApp</li>
                </ul>
            </div>
            
            <div class="instructions">
                <h3>Cancellation Policy</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Free cancellation up to 3 days before arrival</li>
                    <li>After that, cancellation is not possible</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0; padding: 25px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
                <p style="color: #1e293b; text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                    If you have any questions or need help, we are here for you
                </p>
                <p style="text-align: center; margin: 0;">
                    📱 <a href="https://wa.me/972506070260" style="color: #25d366; text-decoration: none; font-weight: 700; font-size: 20px;">WhatsApp</a> <span style="font-size: 18px; color: #64748b; font-weight: 600;">- for any changes or cancellations</span>
                </p>
            </div>
        </div>
        
        <div class="contact-info">
            <p><strong>Airport Guest House</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * יצירת תבנית HTML לאישור הזמנה לאורח - כללית שמבחינה בין שפות
   */
  createGuestConfirmationTemplate(bookingData) {
    // בדיקת שפה ובחירת תבנית מתאימה
    const language = bookingData.language || 'he'; // ברירת מחדל עברית
    
    if (language === 'en') {
      return this.createGuestConfirmationTemplateEN(bookingData);
    } else {
      return this.createGuestConfirmationTemplateHE(bookingData);
    }
  }

  /**
   * שליחת אישור הזמנה לאורח
   */
  async sendGuestConfirmation(bookingData) {
    // אם אין transporter, ננסה להגדיר Ethereal
    if (!this.transporter) {
      console.log('🔄 מגדיר Ethereal transporter...');
      await this.setupEtherealTransporter();
    }
    
    if (!this.transporter) {
      console.error('❌ Email transporter לא מוגדר');
      return { success: false, error: 'שירות מייל לא זמין' };
    }

    try {
             // בדיקה שהמייל תקין
       if (!bookingData.email || !/\S+@\S+\.\S+/.test(bookingData.email)) {
         throw new Error('כתובת מייל לא תקינה');
       }

       // בחירת כותרת מייל לפי שפה
       const language = bookingData.language || 'he';
       const subject = language === 'en' 
         ? `Booking Confirmation #${String(bookingData.bookingNumber).padStart(6, '0')} - Airport Guest House`
         : `אישור הזמנה ${String(bookingData.bookingNumber).padStart(6, '0')} - Airport Guest House`;

       const mailOptions = {
         from: `"Airport Guest House" <${this.fromEmail}>`,
         to: bookingData.email,
         subject: subject,
         html: this.createGuestConfirmationTemplate(bookingData),
         text: language === 'en' 
           ? `Hello ${bookingData.firstName || 'Dear Guest'},\n\nYour booking has been confirmed!\n\nBooking Number: ${bookingData.bookingNumber}\nCheck-in: ${bookingData.checkIn}\nCheck-out: ${bookingData.checkOut}\nPrice: ₪${bookingData.price}\n\nWe look forward to welcoming you!\nAirport Guest House`
           : `שלום ${bookingData.firstName || 'אורח יקר'},\n\nההזמנה שלך אושרה!\n\nמספר הזמנה: ${bookingData.bookingNumber}\nצ'ק-אין: ${bookingData.checkIn}\nצ'ק-אאוט: ${bookingData.checkOut}\nמחיר: ${bookingData.price} ₪\n\nמחכים לכם!\nAirport Guest House`
       };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ אישור הזמנה נשלח לאורח:', info.messageId);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ שגיאה בשליחת אישור לאורח:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * שליחת הודעה למנהל על הזמנה חדשה
   */
  async sendAdminNotification(bookingData) {
    // אם אין transporter, ננסה להגדיר Ethereal
    if (!this.transporter) {
      console.log('🔄 מגדיר Ethereal transporter...');
      await this.setupEtherealTransporter();
    }
    
    if (!this.transporter) {
      console.error('❌ Email transporter לא מוגדר');
      return { success: false, error: 'שירות מייל לא זמין' };
    }

    try {
      const mailOptions = {
        from: `"Diam Hotels System" <${this.fromEmail}>`,
        to: this.adminEmail,
        subject: `🚨 הזמנה חדשה מהאתר - ${bookingData.firstName} ${bookingData.lastName}`,
        html: this.createAdminNotificationTemplate(bookingData),
        text: `הזמנה חדשה התקבלה מהאתר הציבורי:\n\nמספר הזמנה: ${bookingData.bookingNumber}\nאורח: ${bookingData.firstName} ${bookingData.lastName}\nטלפון: ${bookingData.phone}\nמחיר: ${bookingData.price} ₪`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ הודעה נשלחה למנהל:', info.messageId);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ שגיאה בשליחת הודעה למנהל:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * שליחת שני המיילים - לאורח ולמנהל
   */
  async sendBookingEmails(bookingData) {
    console.log('📧 שולח מיילים להזמנה:', bookingData.bookingNumber);
    
    const results = await Promise.allSettled([
      this.sendGuestConfirmation(bookingData),
      this.sendAdminNotification(bookingData)
    ]);

    const [guestResult, adminResult] = results;
    
    return {
      guest: guestResult.status === 'fulfilled' ? guestResult.value : { success: false, error: guestResult.reason },
      admin: adminResult.status === 'fulfilled' ? adminResult.value : { success: false, error: adminResult.reason }
    };
  }
}

module.exports = new EmailService(); 