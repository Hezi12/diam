/**
 * שירות מיילים למערכת דיאם
 * מטפל בשליחת מיילים להזמנות ציבוריות
 */

const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { he } = require('date-fns/locale');

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
    * יצירת תבנית HTML לאישור הזמנה לאורח
    */
   createGuestConfirmationTemplate(bookingData) {
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
            background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
        }
        .header p { 
            margin: 10px 0 0; 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 30px; 
        }
        .booking-number { 
            text-align: center; 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            border: 2px solid #0071e3;
        }
        .booking-number h2 { 
            color: #0071e3; 
            margin: 0; 
            font-size: 24px;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .detail-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-right: 4px solid #0071e3;
        }
        .detail-card h3 { 
            margin: 0 0 10px; 
            color: #0071e3; 
            font-size: 16px;
        }
        .detail-card p { 
            margin: 5px 0; 
            color: #64748b;
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
            background: #fef3c7; 
            padding: 20px; 
            border-radius: 8px; 
            border-right: 4px solid #f59e0b;
            margin: 20px 0;
        }
        .instructions h3 { 
            color: #92400e; 
            margin: 0 0 10px;
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
        @media (max-width: 600px) {
            .details-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ההזמנה אושרה!</h1>
            <p>Airport Guest House - מלונית שדה התעופה</p>
        </div>
        
        <div class="content">
            <div class="booking-number">
                <h2>מספר הזמנה: ${String(bookingData.bookingNumber).padStart(6, '0')}</h2>
            </div>
            
            <div class="details-grid">
                <div class="detail-card">
                    <h3>📅 תאריכי שהייה</h3>
                    <p><strong>צ'ק-אין:</strong> ${checkInFormatted}</p>
                    <p><strong>צ'ק-אאוט:</strong> ${checkOutFormatted}</p>
                    <p><strong>מספר לילות:</strong> ${bookingData.nights}</p>
                </div>
                
                <div class="detail-card">
                    <h3>🏨 פרטי החדר</h3>
                    <p><strong>סוג חדר:</strong> ${bookingData.roomType}</p>
                    <p><strong>מספר חדר:</strong> ${bookingData.roomNumber}</p>
                    <p><strong>מספר אורחים:</strong> ${bookingData.guests}</p>
                </div>
            </div>
            
            <div class="price-summary">
                <h3>סכום לתשלום במלונית</h3>
                <div class="amount">${bookingData.price} ₪</div>
            </div>
            
            <div class="instructions">
                <h3>⏰ הוראות חשובות</h3>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li>צ'ק-אין החל מהשעה 14:00</li>
                    <li>צ'ק-אאוט עד השעה 11:00</li>
                    <li>התשלום מתבצע בהגעה (מזומן או כרטיס אשראי)</li>
                    <li>נא להביא תעודת זהות או דרכון</li>
                    <li>חניה חינם זמינה</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #0071e3; font-weight: 600;">
                    מחכים לכם! 🏨
                </p>
                <p style="color: #64748b;">
                    אם יש שאלות או צורך בעזרה, אנו כאן בשבילכם
                </p>
            </div>
        </div>
        
        <div class="contact-info">
            <p><strong>Airport Guest House</strong></p>
            <p>📞 <a href="tel:+972506070260">050-607-0260</a></p>
            <p>📱 <a href="https://wa.me/972506070260">WhatsApp</a></p>
            <p>🗺️ במרחק 5 דקות מנתב״ג</p>
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

       const mailOptions = {
         from: `"Airport Guest House" <${this.fromEmail}>`,
         to: bookingData.email,
         subject: `אישור הזמנה ${String(bookingData.bookingNumber).padStart(6, '0')} - Airport Guest House`,
         html: this.createGuestConfirmationTemplate(bookingData),
         text: `שלום ${bookingData.firstName || 'אורח יקר'},\n\nההזמנה שלך אושרה!\n\nמספר הזמנה: ${bookingData.bookingNumber}\nצ'ק-אין: ${bookingData.checkIn}\nצ'ק-אאוט: ${bookingData.checkOut}\nמחיר: ${bookingData.price} ₪\n\nמחכים לכם!\nAirport Guest House`
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