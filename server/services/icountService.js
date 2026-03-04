/**
 * שירות לאינטגרציה עם מערכת iCount
 * שירות זה מטפל בתקשורת עם ה-API של iCount ליצירת חשבוניות וניהולן
 * 
 * סטטוס: פעיל ומחובר ✅
 * תכונות: סליקת אשראי אמיתית, זיהוי אוטומטי של סוג כרטיס, תמיכה בשני מתחמים, יצירת חשבוניות אוטומטית
 * 
 * 🚀 שדרוג אדריכלות INVREC (יולי 2025): החלפה למסמכים משולבים
 * - פונקציית createInvoiceWithReceipt עכשיו משתמשת ב-doctype: 'invrec'
 * - מסמך אחד משולב של חשבונית מס + קבלה (במקום שני מסמכים נפרדים)
 * - פותר הפרשי אגורות ומורכבות טכנית של קישור בין מסמכים
 * - איזון אוטומטי מושלם ללא צורך בקישור ידני
 * 
 * עדכון אחרון: יולי 2025
 */

const axios = require('axios');

class ICountService {
  constructor() {
    this.baseUrl = 'https://api.icount.co.il/api/v3.php';
    
    // הגדרת axios עם timeout מותאם
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 שניות timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DiamHotels/1.0'
      }
    });
    
    // הגדרות חשבונות לפי מיקום - נטענים ממשתני סביבה
    this.accounts = {
      airport: {
        companyId: process.env.ICOUNT_AIRPORT_COMPANY_ID || 'Airport',
        username: process.env.ICOUNT_AIRPORT_USERNAME || 'diamshotels',
        password: process.env.ICOUNT_AIRPORT_PASSWORD || 'Hezi!3225',
        vatId: process.env.ICOUNT_VAT_ID || '516679909'
      },
      rothschild: {
        companyId: process.env.ICOUNT_ROTHSCHILD_COMPANY_ID || 'diamshotels',
        username: process.env.ICOUNT_ROTHSCHILD_USERNAME || 'diamshotels',
        password: process.env.ICOUNT_ROTHSCHILD_PASSWORD || 'Hezi!3225',
        vatId: process.env.ICOUNT_VAT_ID || '516679909'
      }
    };
  }

  /**
   * יצירת לקוח חדש ב-iCount
   * 
   * @param {Object} customerData - פרטי הלקוח
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת יצירת הלקוח
   */
  async createCustomer(customerData, location = 'rothschild') {
    try {
      console.log(`👤 יוצר לקוח חדש ב-iCount עבור מיקום ${location}`);
      
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון הרלוונטיים
      const accountDetails = this.accounts[normalizedLocation];
      
      if (!accountDetails) {
        throw new Error(`פרטי חשבון לא נמצאו עבור מיקום: ${location}`);
      }
      
      if (!customerData || !customerData.name) {
        throw new Error('שם הלקוח הוא שדה חובה');
      }

      // יצירת מייל ייחודי לכל לקוח כדי למנוע כפילויות ב-iCount
      const uniqueEmail = this.generateUniqueEmail(customerData, normalizedLocation);
      
      console.log(`📧 מייל ייחודי שנוצר: ${uniqueEmail}`);
      
      // הכנת נתוני הבקשה ליצירת לקוח
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        
        // פרטי הלקוח
        client_name: customerData.name.trim(),
        email: uniqueEmail, // 🎯 מייל ייחודי במקום guest@diamhotels.com
        address: customerData.address || '',
        phone: customerData.phone || '',
        
        // מזהה לקוח - אם יש ת.ז. או דרכון
        client_id: customerData.identifier || '',
        
        // הגדרות בסיסיות
        lang: 'he',
        currency_code: 'ILS'
      };
      
      console.log(`📤 שולח בקשה ליצירת לקוח:`);
      console.log(`   - שם: ${requestData.client_name}`);
      console.log(`   - מייל: ${requestData.email} 🎯 (ייחודי!)`);
      console.log(`   - טלפון: ${requestData.phone}`);
      console.log(`   - מזהה: ${requestData.client_id}`);
      
      // שליחת הבקשה ל-API של iCount
      const startTime = Date.now();
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/client/create`,
        requestData
      );
      const endTime = Date.now();
      
      console.log(`⚡ זמן תגובה מ-iCount ליצירת לקוח: ${endTime - startTime}ms`);
      
      if (response.data && response.data.status === 'error') {
        // אם הלקוח כבר קיים, ננסה לחפש אותו
        if (response.data.error && response.data.error.includes('already exists')) {
          console.log(`🔍 לקוח כבר קיים, מחפש את המזהה שלו...`);
          return await this.findCustomer(customerData, location);
        }
        throw new Error(`שגיאה ביצירת לקוח ב-iCount: ${response.data.error}`);
      }
      
      const customerId = response.data.client_id || response.data.id;
      console.log(`✅ לקוח נוצר בהצלחה עם מזהה: ${customerId}`);
      
      return {
        success: true,
        customerId: customerId,
        data: response.data,
        message: `לקוח ${customerData.name} נוצר בהצלחה`
      };
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת לקוח ב-iCount:', error.message);
      throw error;
    }
  }

  /**
   * יצירת מייל ייחודי לכל לקוח כדי למנוע כפילויות ב-iCount
   * 
   * @param {Object} customerData - פרטי הלקוח
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {string} - מייל ייחודי
   */
  generateUniqueEmail(customerData, location) {
    try {
      // אם יש מייל אמיתי ללקוח - נשתמש בו
      if (customerData.email && 
          customerData.email.trim() !== '' && 
          customerData.email !== 'guest@diamhotels.com' &&
          customerData.email.includes('@') && 
          customerData.email.includes('.')) {
        console.log(`📧 משתמש במייל אמיתי של הלקוח: ${customerData.email}`);
        return customerData.email.trim().toLowerCase();
      }
      
      // יצירת מייל ייחודי מבוסס על שם + timestamp + location
      const cleanName = customerData.name
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '') // הסרת תווים מיוחדים, שמירה על עברית ואנגלית
        .substring(0, 20); // הגבלה ל-20 תווים
      
      const timestamp = Date.now().toString().slice(-6); // 6 ספרות אחרונות מהזמן
      const locationPrefix = location === 'airport' ? 'apt' : 'roth';
      
      const uniqueEmail = `${cleanName}-${locationPrefix}-${timestamp}@diamhotels.com`;
      
      console.log(`📧 נוצר מייל ייחודי: ${uniqueEmail} (מבוסס על: ${customerData.name})`);
      return uniqueEmail;
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת מייל ייחודי:', error.message);
      
      // פולבק - מייל עם timestamp בלבד
      const fallbackEmail = `customer-${Date.now()}@diamhotels.com`;
      console.log(`🔄 פולבק - מייל: ${fallbackEmail}`);
      return fallbackEmail;
    }
  }

  /**
   * חיפוש לקוח קיים ב-iCount לפי שם
   * 
   * @param {Object} customerData - פרטי הלקוח לחיפוש
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת החיפוש
   */
  async findCustomer(customerData, location = 'rothschild') {
    try {
      console.log(`🔍 מחפש לקוח קיים ב-iCount עבור מיקום ${location}`);
      
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון הרלוונטיים
      const accountDetails = this.accounts[normalizedLocation];
      
      if (!accountDetails) {
        throw new Error(`פרטי חשבון לא נמצאו עבור מיקום: ${location}`);
      }

      // הכנת נתוני הבקשה לחיפוש לקוחות
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        
        // פרמטרי חיפוש - נחפש לפי שם
        search: customerData.name.trim()
      };
      
      console.log(`🔎 מחפש לקוח בשם: "${requestData.search}"`);
      
      // שליחת בקשת חיפוש
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/client/search`,
        requestData
      );
      
      if (response.data && response.data.status === 'error') {
        throw new Error(`שגיאה בחיפוש לקוח ב-iCount: ${response.data.error}`);
      }
      
      // בדיקה אם נמצאו תוצאות
      const clients = response.data.clients || response.data || [];
      
      if (!clients || clients.length === 0) {
        console.log(`❌ לא נמצא לקוח בשם "${customerData.name}"`);
        return {
          success: false,
          found: false,
          message: `לקוח בשם "${customerData.name}" לא נמצא`
        };
      }
      
      // נחפש התאמה מדויקת לשם
      const exactMatch = clients.find(client => 
        client.client_name && 
        client.client_name.trim().toLowerCase() === customerData.name.trim().toLowerCase()
      );
      
      if (exactMatch) {
        console.log(`✅ נמצא לקוח קיים עם מזהה: ${exactMatch.client_id}`);
        return {
          success: true,
          found: true,
          customerId: exactMatch.client_id,
          data: exactMatch,
          message: `נמצא לקוח קיים: ${exactMatch.client_name}`
        };
      }
      
      // אם לא נמצאה התאמה מדויקת, לא נשתמש בלקוח שגוי!
      console.log(`⚠️ לא נמצאה התאמה מדויקת לשם "${customerData.name}"`);
      console.log(`📋 נמצאו לקוחות דומים:`, clients.map(c => c.client_name).join(', '));
      console.log(`❌ לא נשתמש בלקוח שגוי - נחזיר שלא נמצא כדי ליצור לקוח חדש`);
      
      return {
        success: false,
        found: false,
        message: `לא נמצא לקוח בשם "${customerData.name}" - נדרש לקוח חדש`
      };
      
    } catch (error) {
      console.error('❌ שגיאה בחיפוש לקוח ב-iCount:', error.message);
      
      // אם החיפוש נכשל, נחזיר שלא נמצא
      return {
        success: false,
        found: false,
        error: error.message,
        message: 'שגיאה בחיפוש לקוח'
      };
    }
  }

  /**
   * קבלת או יצירת לקוח ב-iCount (פונקציה מרכזית)
   * 
   * עדכון: מכיוון שאין API תקין לחיפוש לקוחות ב-iCount,
   * אנחנו פשוט יוצרים לקוח חדש בכל פעם.
   * זה מבטיח שכל חשבונית תהיה תחת הלקוח הנכון.
   * 
   * @param {Object} customerData - פרטי הלקוח
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - מזהה הלקוח
   */
  async getOrCreateCustomer(customerData, location = 'rothschild') {
    try {
      console.log(`🎯 יוצר לקוח חדש: "${customerData.name}" (מיקום: ${location})`);
      console.log(`📋 פרטי לקוח מלאים:`, {
        name: customerData.name,
        email: customerData.email || 'לא צוין',
        phone: customerData.phone || 'לא צוין',
        identifier: customerData.identifier || 'לא צוין'
      });
      
      // בדיקת תקינות נתונים
      if (!customerData || !customerData.name || customerData.name.trim() === '') {
        throw new Error('שם הלקוח הוא שדה חובה');
      }
      
      // יצירת לקוח חדש ישירות (ללא חיפוש)
      console.log(`🆕 יוצר לקוח חדש בשם "${customerData.name}" ב-iCount...`);
      const createResult = await this.createCustomer(customerData, location);
      
      if (createResult.success) {
        console.log(`✅ נוצר לקוח חדש עם מזהה: ${createResult.customerId}`);
        console.log(`🔒 מזהה זה שייך ל-"${customerData.name}" ולא לאף אחד אחר`);
        return {
          success: true,
          customerId: createResult.customerId,
          isNew: true,
          message: `נוצר לקוח חדש: ${customerData.name}`
        };
      }
      
      throw new Error('נכשל ביצירת לקוח חדש');
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת לקוח:', error.message);
      
      // פולבק - נחזור ללקוח ברירת המחדל
      console.log(`🔄 פולבק: משתמש בלקוח ברירת המחדל (client_id: "0")`);
      return {
        success: true,
        customerId: "0",
        isNew: false,
        isDefault: true,
        message: `שימוש בלקוח ברירת המחדל עקב שגיאה: ${error.message}`
      };
    }
  }

  /**
   * יצירת חשבונית ב-iCount
   * 
   * @param {Object} invoiceData - נתוני החשבונית
   * @param {string} location - מיקום (airport/rothschild)
   * @param {string} documentType - סוג מסמך (invoice)
   * @returns {Promise<Object>} - תוצאת יצירת החשבונית
   */
  async createInvoice(invoiceData, location = 'rothschild', documentType = 'invoice') {
    try {
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון הרלוונטיים
      const accountDetails = this.accounts[normalizedLocation];
      
      if (!accountDetails) {
        throw new Error(`פרטי חשבון לא נמצאו עבור מיקום: ${location}`);
      }
      
      if (!invoiceData || !invoiceData.customer || !invoiceData.items) {
        throw new Error('נתוני חשבונית חסרים או לא מלאים');
      }
      
      // רק חשבונית מס נתמכת
      if (documentType !== 'invoice') {
        throw new Error('רק חשבונית מס נתמכת');
      }

      // בדיקה האם יש פריט פטור ממע"מ
      const hasTaxExemptItem = invoiceData.items.some(item => item.taxExempt === true);
      console.log(`🏷️ האם יש פריט פטור ממע"מ: ${hasTaxExemptItem ? 'כן' : 'לא'}`);
      
      // שלב 1: קבלת או יצירת לקוח ב-iCount
      console.log(`👤 שלב 1: מקבל או יוצר לקוח ב-iCount...`);
      const customerResult = await this.getOrCreateCustomer(invoiceData.customer, normalizedLocation);
      
      if (!customerResult.success) {
        throw new Error('נכשל בקבלת או יצירת לקוח ב-iCount');
      }
      
      console.log(`✅ מזהה לקוח: ${customerResult.customerId} (${customerResult.isNew ? 'חדש' : 'קיים'}${customerResult.isDefault ? ' - ברירת מחדל' : ''})`);
      console.log(`📝 הודעה: ${customerResult.message}`);
      
      // הכנת נתוני הבקשה לפי דרישות ה-API של iCount
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // סוג מסמך וסטטוס
        doctype: 'invoice',
        
        // פרטי לקוח - כעת עם מזהה אמיתי!
        client_name: invoiceData.customer.name,
        client_id: customerResult.customerId, // 🎯 זה השינוי הקריטי!
        email: invoiceData.customer.email || '',
        client_address: invoiceData.customer.address || '',
        client_phone: invoiceData.customer.phone || '',
        
        // הגדרות
        lang: 'he',
        currency_code: 'ILS',
        
        // פרטי תשלום
        doc_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        
        // פריטים - תיקון המיפוי של tax_exempt
        items: invoiceData.items.map(item => {
          const mappedItem = {
            description: item.description || 'שירות אירוח',
            quantity: item.quantity || 1,
            unitprice: item.unitPrice || 0
          };
          
          // תיקון: הוספת tax_exempt לפי הערך שנקבע
          if (item.taxExempt === true) {
            mappedItem.tax_exempt = true;
            console.log(`📋 פריט פטור ממע"מ: ${item.description} - ${item.unitPrice} ₪`);
          } else {
            // עבור פריטים רגילים (עם מע"מ)
            mappedItem.tax_exempt = false;
            console.log(`📋 פריט רגיל (עם מע"מ): ${item.description} - ${item.unitPrice} ₪`);
          }
          
          return mappedItem;
        }),
        
        // הערות
        notes: invoiceData.notes || '',
      };

      // הוספת פרטי תשלום אם יש
      if (invoiceData.paymentMethod === 'cash') {
        requestData.cash = { sum: invoiceData.total };
      } else if (invoiceData.paymentMethod === 'credit_card') {
        requestData.cc = { 
          sum: invoiceData.total,
          card_type: invoiceData.cardType || 'VISA'
        };
        
        // אם יש פרטי סליקה, נוסיף אותם לקישור
        if (invoiceData.chargeDetails) {
          requestData.cc.deal_number = invoiceData.chargeDetails.transactionId;
          requestData.cc.confirmation_code = invoiceData.chargeDetails.confirmationCode;
          requestData.cc.card_type = invoiceData.chargeDetails.cardType;
          console.log(`🔗 מקשר חשבונית לסליקה: ${invoiceData.chargeDetails.transactionId}`);
        }
      } else if (invoiceData.paymentMethod === 'bank_transfer') {
        requestData.banktransfer = {
          sum: invoiceData.total,
          reference: invoiceData.transferReference || ''
        };
      }
      
      // הדפסת פרטי הבקשה לדיבוג
      console.log(`📤 שולח בקשה ליצירת חשבונית במיקום ${normalizedLocation}:`);
      console.log(`👤 לקוח: ${requestData.client_name}`);
      console.log(`💰 סכום כולל: ${invoiceData.total} ₪`);
      console.log(`📋 פריטים:`, requestData.items.map(item => ({
        description: item.description,
        unitprice: item.unitprice,
        tax_exempt: item.tax_exempt
      })));
      
      // שליחת הבקשה ל-API של iCount
      console.log(`🌐 מתחבר ל-iCount API: ${this.baseUrl}/doc/create`);
      console.log(`⏱️ יש timeout של 30 שניות`);
      
      const startTime = Date.now();
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/doc/create`,
        requestData
      );
      const endTime = Date.now();
      
      console.log(`⚡ זמן תגובה מ-iCount: ${endTime - startTime}ms`);
      
      if (response.data && response.data.status === 'error') {
        throw new Error(`שגיאה ביצירת מסמך ב-iCount: ${response.data.error}`);
      }
      
      console.log(`✅ חשבונית נוצרה בהצלחה: ${response.data.docnum}`);
      
      return {
        success: true,
        data: response.data,
        invoiceNumber: response.data.docnum
      };
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת מסמך ב-iCount:', error.message);
      
      // טיפול מפורט בסוגי שגיאות שונים
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ השגיאה: timeout - החיבור ל-iCount API לקח יותר מ-30 שניות');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 השגיאה: חיבור נדחה - iCount API לא זמין');
      } else if (error.code === 'ENOTFOUND') {
        console.error('🌐 השגיאה: DNS לא נמצא - בעיה בפתרון כתובת iCount API');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ השגיאה: timeout ברשת - החיבור ל-iCount API נכשל');
      }
      
      // אם יש תשובה משרת iCount עם פרטי שגיאה
      if (error.response && error.response.data) {
        console.error('🔍 פרטי השגיאה מ-iCount:', error.response.data);
        console.error('📊 סטטוס HTTP:', error.response.status);
        console.error('📋 headers:', error.response.headers);
      }
      
      throw error;
    }
  }

  /**
   * זיהוי אוטומטי של סוג כרטיס אשראי לפי המספר
   * @param {string} cardNumber - מספר כרטיס האשראי
   * @returns {string} - סוג הכרטיס (VISA, MASTERCARD, ISRACARD, AMEX)
   */
  identifyCardType(cardNumber) {
    // הסרת רווחים ותווים מיוחדים
    const cleanCardNumber = cardNumber.replace(/\s|-/g, '');
    
    // בדיקת התחלות מספרים אופייניות
    if (cleanCardNumber.startsWith('4')) {
      return 'VISA';
    } else if (cleanCardNumber.startsWith('5') || cleanCardNumber.startsWith('2')) {
      return 'MASTERCARD';
    } else if (cleanCardNumber.startsWith('34') || cleanCardNumber.startsWith('37')) {
      return 'AMEX';
    } else if (cleanCardNumber.startsWith('3')) {
      return 'ISRACARD'; // ישראכארט מתחיל ב-3
    } else {
      return 'VISA'; // ברירת מחדל
    }
  }

  /**
   * סליקת כרטיס אשראי ויצירת חשבונית עם קבלה בפעולה אחת
   * 
   * @param {Object} booking - פרטי ההזמנה
   * @param {number} amount - סכום הסליקה
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת הסליקה והחשבונית עם הקבלה
   */
  async chargeCardAndCreateInvoice(booking, amount, location = 'rothschild') {
    try {
      console.log(`🔄 מתחיל תהליך סליקת אשראי + יצירת חשבונית עם קבלה עבור מתחם ${location}`);
      
      // שלב 1: ביצוע סליקת כרטיס אשראי
      console.log(`💳 שלב 1: מבצע סליקת כרטיס אשראי בסכום ${amount} ₪`);
      const chargeResult = await this.chargeCardOnly(booking, amount, location);
      
      if (!chargeResult.success) {
        throw new Error('סליקת כרטיס האשראי נכשלה');
      }
      
      console.log(`✅ סליקה הושלמה בהצלחה: ${chargeResult.transactionId}`);
      
      // שלב 2: יצירת חשבונית עם קבלה על סכום הסליקה בפועל
      console.log(`📄 שלב 2: יוצר חשבונית עם קבלה על סכום ${amount} ₪`);
      
      // בדיקה אם הלקוח תייר - אם כן, פטור ממע"מ
      const isTaxExempt = booking.isTourist === true;
      console.log(`👤 סטטוס לקוח: ${isTaxExempt ? 'תייר (פטור ממע"מ)' : 'תושב (כולל מע"מ)'}`);
      console.log(`🔍 דיבוג - booking.isTourist = ${booking.isTourist} (type: ${typeof booking.isTourist})`);
      
      // חישוב מחיר יחידה לפי סטטוס המע"מ
      // תיקון קריטי: חישוב מדויק למניעת הפרשי אגורות
      let unitPrice, totalPrice, taxExempt;
      
      if (isTaxExempt) {
        // תייר - החשבונית צריכה להיות על הסכום שנסלק (ללא מע"מ)
        unitPrice = amount;
        totalPrice = amount;
        taxExempt = true; // פטור ממע"מ
        console.log(`💰 חשבונית לתייר: ${amount} ₪ (ללא מע"מ) - unitPrice=${unitPrice}, totalPrice=${totalPrice}, taxExempt=${taxExempt}`);
      } else {
        // תושב - הסכום שנסלק כולל כבר מע"מ
        // חישוב מדויק: במקום לחלק ב-1.18, נמצא את המחיר הבסיסי שעם מע"מ נותן בדיוק את הסכום שנסלק
        const basePrice = Math.floor((amount / 1.18) * 100) / 100; // עיגול כלפי מטה
        const calculatedVat = Math.round((basePrice * 0.18) * 100) / 100; // חישוב מע"מ
        const calculatedTotal = basePrice + calculatedVat; // סכום כולל
        
        if (Math.abs(calculatedTotal - amount) < 0.01) {
          // אם הסכום המחושב קרוב מספיק לסכום שנסלק
          unitPrice = basePrice;
          totalPrice = amount;
          taxExempt = false; // עם מע"מ
          console.log(`💰 חשבונית לתושב: ${basePrice} ₪ + מע"מ ${calculatedVat} ₪ = ${calculatedTotal} ₪ (מול ${amount} ₪ שנסלק)`);
        } else {
          // אם יש הפרש, נשתמש בגישה פטורה ממע"מ
          unitPrice = amount;
          totalPrice = amount;
          taxExempt = true; // פטור ממע"מ למניעת הפרשי אגורות
          console.log(`💰 חשבונית לתושב (פטור למניעת הפרש): ${amount} ₪ - הפרש מחושב: ${Math.abs(calculatedTotal - amount)}`);
        }
      }
      
      // הכנת נתוני החשבונית
      const invoiceData = {
        customer: {
          name: `${booking.firstName} ${booking.lastName}`.trim(),
          email: booking.email || 'guest@diamshotels.com',
          identifier: booking.idNumber || '',
          address: booking.address || '',
          phone: booking.phone || ''
        },
        items: [{
          description: `תשלום עבור הזמנה ${booking.bookingNumber}`,
          quantity: 1,
          unitPrice: unitPrice,
          taxExempt: taxExempt // שימוש במשתנה החדש במקום isTaxExempt
        }],
        total: totalPrice,
        paymentMethod: 'credit_card',
        issueDate: new Date(),
        notes: `סליקת כרטיס אשראי - מספר עסקה: ${chargeResult.transactionId || 'לא זמין'}\nהזמנה מספר: ${booking.bookingNumber}\nסוג כרטיס: ${chargeResult.cardType}`,
        cardType: chargeResult.cardType,
        // הוספת פרטי הסליקה לקישור
        chargeDetails: {
          transactionId: chargeResult.transactionId,
          confirmationCode: chargeResult.confirmationCode,
          amount: amount,
          cardType: chargeResult.cardType
        }
      };
      
      console.log(`📋 נתוני חשבונית לפני שליחה:`);
      console.log(`   - לקוח: ${invoiceData.customer.name}`);
      console.log(`   - פריט: ${invoiceData.items[0].description}`);
      console.log(`   - מחיר יחידה: ${invoiceData.items[0].unitPrice} ₪`);
      console.log(`   - פטור ממע"מ: ${invoiceData.items[0].taxExempt}`);
      console.log(`   - סכום כולל: ${invoiceData.total} ₪`);
      
      const invoiceResult = await this.createInvoiceWithReceipt(invoiceData, location, 'credit_card');
      
      if (!invoiceResult.success) {
        console.log(`⚠️  אזהרה: סליקה הצליחה אבל יצירת החשבונית עם הקבלה נכשלה`);
        // לא נזרוק שגיאה כי הסליקה עצמה הצליחה
      } else {
        console.log(`✅ חשבונית עם קבלה נוצרה בהצלחה: ${invoiceResult.invoiceNumber}`);
      }
      
      return {
        success: true,
        charge: chargeResult,
        invoice: invoiceResult,
        message: invoiceResult.success 
          ? 'סליקה וחשבונית עם קבלה בוצעו בהצלחה'
          : 'סליקה בוצעה בהצלחה, אך יצירת החשבונית עם הקבלה נכשלה'
      };
      
    } catch (error) {
      console.error('❌ שגיאה בתהליך סליקה ויצירת חשבונית:', error);
      throw error;
    }
  }

  /**
   * סליקת כרטיס אשראי בלבד (ללא חשבונית)
   * 
   * @param {Object} booking - פרטי ההזמנה
   * @param {number} amount - סכום לסליקה
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת הסליקה
   */
  async chargeCardOnly(booking, amount, location = 'rothschild') {
    try {
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון
      const accountDetails = this.accounts[normalizedLocation];
      
      if (!accountDetails) {
        throw new Error(`פרטי חשבון לא נמצאו עבור מיקום: ${location}`);
      }
      
      // בדיקת פרטי כרטיס אשראי
      if (!booking.creditCard || !booking.creditCard.cardNumber) {
        throw new Error('פרטי כרטיס אשראי חסרים');
      }
      
      // טיפול במייל חסר
      const email = booking.email || 'guest@diamshotels.com';
      if (!booking.email) {
        console.log('⚠️  אזהרה: אין מייל ללקוח, אשתמש במייל ברירת מחדל');
      }
      
      // זיהוי סוג כרטיס
      const cardType = this.identifyCardType(booking.creditCard.cardNumber);
      console.log(`💳 זוהה סוג כרטיס: ${cardType}`);
      
      // הכנת נתוני הבקשה
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // פרטי לקוח - לסליקה אנחנו לא צריכים לקוח קיים, רק את הפרטים
        client_name: `${booking.firstName} ${booking.lastName}`.trim(),
        email: email,
        
        // פרטי תשלום
        sum: amount,
        cc_number: booking.creditCard.cardNumber.replace(/\s|-/g, ''),
        cc_type: cardType,
        cc_cvv: booking.creditCard.cvv,
        cc_validity: booking.creditCard.expiryDate.replace(/\s|-/g, ''),
        cc_holder_name: `${booking.firstName} ${booking.lastName}`.trim(),
        
        // פרטים נוספים
        description: `תשלום עבור הזמנה ${booking.bookingNumber}`,
        currency: 'ILS'
      };
      
      console.log(`💰 מבצע סליקה בסכום ${amount} ₪`);
      console.log(`📋 פרטי בקשה:`, {
        client_name: requestData.client_name,
        email: requestData.email,
        sum: requestData.sum,
        cc_type: requestData.cc_type
      });
      
      // שליחת בקשת סליקה
      console.log(`🌐 מתחבר ל-iCount API לסליקה: ${this.baseUrl}/cc/bill`);
      console.log(`⏱️ יש timeout של 30 שניות`);
      
      const startTime = Date.now();
      const response = await this.axiosInstance.post(`${this.baseUrl}/cc/bill`, requestData);
      const endTime = Date.now();
      
      console.log(`⚡ זמן תגובה מ-iCount לסליקה: ${endTime - startTime}ms`);
      
      console.log(`✅ תגובה מ-iCount:`, response.data);
      
      // בדיקת הצלחה
      const isSuccess = response.data.status === true || 
                       response.data.success === true ||
                       response.data.status === 'success';
      
      if (!isSuccess) {
        const errorMessage = response.data.error_description || 
                           response.data.reason || 
                           'סליקה נכשלה';
        throw new Error(errorMessage);
      }
      
      console.log(`🎉 סליקה בוצעה בהצלחה!`);
      
      return {
        success: true,
        transactionId: response.data.deal_number || response.data.uid || response.data.confirmation_code || 'unknown',
        amount: amount,
        cardType: cardType,
        confirmationCode: response.data.confirmation_code,
        fullResponse: response.data
      };
      
    } catch (error) {
      console.error('❌ שגיאה בחיוב כרטיס אשראי:', error.message);
      
      // טיפול מפורט בסוגי שגיאות שונים
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ השגיאה: timeout - החיבור ל-iCount API לקח יותר מ-30 שניות');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 השגיאה: חיבור נדחה - iCount API לא זמין');
      } else if (error.code === 'ENOTFOUND') {
        console.error('🌐 השגיאה: DNS לא נמצא - בעיה בפתרון כתובת iCount API');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ השגיאה: timeout ברשת - החיבור ל-iCount API נכשל');
      }
      
      if (error.response && error.response.data) {
        console.error('🔍 פרטי השגיאה מ-iCount:', error.response.data);
        console.error('📊 סטטוס HTTP:', error.response.status);
      }
      
      throw error;
    }
  }

  /**
   * סליקת כרטיס אשראי (נקודת כניסה ראשית)
   * כעת מבצעת גם יצירת חשבונית אוטומטית
   * 
   * @param {Object} booking - פרטי ההזמנה
   * @param {number} amount - סכום לסליקה
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת הסליקה והחשבונית
   */
  async chargeCard(booking, amount, location = 'rothschild') {
    console.log(`🔄 מתחיל תהליך סליקת אשראי עבור מתחם ${location}`);
    
    // קריאה לפונקציה המשולבת שמבצעת סליקה + חשבונית
    return await this.chargeCardAndCreateInvoice(booking, amount, location);
  }

  /**
   * יצירת חשבונית מס עם קבלה מקושרת ב-iCount
   * 
   * פונקציה זו יוצרת שני מסמכים מקושרים טכנית:
   * 1. חשבונית מס - עם הפריטים המלאים והמע"מ הרלוונטי
   * 2. קבלה מקושרת - עם פרמטר related_doc_num שמאפס את החשבונית אוטומטית
   * 
   * ⚡ החידוש החשוב: הוספת related_doc_num מבטיחה קישור טכני בין המסמכים
   * כך שהחשבונית תאופס אוטומטית במערכת iCount ולא תישאר כחוב פתוח
   * 
   * @param {Object} invoiceData - נתוני החשבונית
   * @param {string} location - מיקום (airport/rothschild)
   * @param {string} paymentMethod - אמצעי התשלום (cash, credit_card, bit, bank_transfer)
   * @returns {Promise<Object>} - תוצאת יצירת החשבונית עם הקבלה המקושרת
   */
  /**
   * יצירת חשבונית מס קבלה משולבת ב-iCount
   * 
   * משתמש ב-doctype "invrec" שיוצר מסמך אחד משולב של חשבונית מס + קבלה
   * זה פותר את הבעיות של קישור טכני והפרשי אגורות
   * 
   * @param {Object} invoiceData - נתוני החשבונית
   * @param {string} location - מיקום (airport/rothschild)
   * @param {string} paymentMethod - אמצעי תשלום
   * @returns {Promise<Object>} - תוצאה
   */
  async createInvoiceWithReceipt(invoiceData, location = 'rothschild', paymentMethod = 'cash') {
    try {
      console.log(`📄 יוצר חשבונית מס קבלה משולבת (invrec) במיקום ${location} עם אמצעי תשלום: ${paymentMethod}`);
      
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון הרלוונטיים
      const accountDetails = this.accounts[normalizedLocation];
      
      if (!accountDetails) {
        throw new Error(`פרטי חשבון לא נמצאו עבור מיקום: ${location}`);
      }
      
      if (!invoiceData || !invoiceData.customer || !invoiceData.items) {
        throw new Error('נתוני חשבונית חסרים או לא מלאים');
      }

      // בדיקה האם יש פריט פטור ממע"מ
      const hasTaxExemptItem = invoiceData.items.some(item => item.taxExempt === true);
      console.log(`🏷️ האם יש פריט פטור ממע"מ: ${hasTaxExemptItem ? 'כן' : 'לא'}`);
      
      // שלב 1: קבלת או יצירת לקוח ב-iCount
      console.log(`👤 שלב 1: מקבל או יוצר לקוח ב-iCount...`);
      const customerResult = await this.getOrCreateCustomer(invoiceData.customer, normalizedLocation);
      
      if (!customerResult.success) {
        throw new Error('נכשל בקבלת או יצירת לקוח ב-iCount');
      }
      
      console.log(`✅ מזהה לקוח: ${customerResult.customerId} (${customerResult.isNew ? 'חדש' : 'קיים'}${customerResult.isDefault ? ' - ברירת מחדל' : ''})`);
      console.log(`📝 הודעה: ${customerResult.message}`);
      
      // הסכום לתשלום צריך להיות הסכום שבאמת נגבה
      const paymentAmount = invoiceData.paymentAmount || invoiceData.total;
      
      console.log(`💡 יוצר מסמך invrec משולב - חשבונית מס קבלה במסמך אחד`);
      console.log(`� סכום: ${paymentAmount} ₪, אמצעי תשלום: ${paymentMethod}`);
      
      // יצירת מסמך invrec משולב
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // סוג מסמך - חשבונית מס קבלה משולבת!
        doctype: 'invrec',
        
        // פרטי לקוח - כעת עם מזהה אמיתי!
        client_name: invoiceData.customer.name,
        client_id: customerResult.customerId, // 🎯 זה השינוי הקריטי!
        email: invoiceData.customer.email || '',
        client_address: invoiceData.customer.address || '',
        client_phone: invoiceData.customer.phone || '',
        
        // הגדרות
        lang: 'he',
        currency_code: 'ILS',
        
        // פרטי תשלום
        doc_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        
        // פריטים - אותם פריטים כמו בחשבונית
        items: invoiceData.items.map(item => {
          const mappedItem = {
            description: item.description || 'שירות אירוח',
            quantity: item.quantity || 1,
            unitprice: item.unitPrice || 0
          };
          
          if (item.taxExempt === true) {
            mappedItem.tax_exempt = true;
            console.log(`📋 פריט פטור ממע"מ: ${item.description} - ${item.unitPrice} ₪`);
          } else {
            mappedItem.tax_exempt = false;
            console.log(`📋 פריט רגיל (עם מע"מ): ${item.description} - ${item.unitPrice} ₪`);
          }
          
          return mappedItem;
        }),
        
        // הערות
        notes: invoiceData.notes || '',
      };

      // הוספת פרטי תשלום לפי האמצעי שנבחר
      switch (paymentMethod) {
        case 'cash':
          requestData.cash = { sum: paymentAmount };
          console.log(`💰 תשלום במזומן: ${paymentAmount} ₪`);
          break;
          
        case 'credit_card':
          requestData.cc = { 
            sum: paymentAmount,
            card_type: 'VISA' // ברירת מחדל
          };
          console.log(`💳 תשלום בכרטיס אשראי: ${paymentAmount} ₪`);
          break;
          
        case 'bit':
          // ביט נחשב כהעברה בנקאית עם הערה
          requestData.banktransfer = {
            sum: paymentAmount,
            reference: 'תשלום דרך ביט'
          };
          console.log(`📱 תשלום דרך ביט: ${paymentAmount} ₪`);
          break;
          
        case 'bank_transfer':
          requestData.banktransfer = {
            sum: paymentAmount,
            reference: invoiceData.transferReference || 'העברה בנקאית'
          };
          console.log(`🏦 תשלום בהעברה בנקאית: ${paymentAmount} ₪`);
          break;
          
        default:
          // ברירת מחדל - מזומן
          requestData.cash = { sum: paymentAmount };
          console.log(`💰 תשלום במזומן (ברירת מחדל): ${paymentAmount} ₪`);
      }

      // יצירת המסמך המשולב
      console.log(`🌐 מתחבר ל-iCount API ליצירת invrec: ${this.baseUrl}/doc/create`);
      console.log(`📋 נתוני בקשה:`, {
        doctype: requestData.doctype,
        client_name: requestData.client_name,
        total_amount: paymentAmount,
        payment_method: paymentMethod,
        items_count: requestData.items.length
      });
      
      const startTime = Date.now();
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/doc/create`,
        requestData
      );
      const endTime = Date.now();
      
      console.log(`⚡ זמן תגובה מ-iCount: ${endTime - startTime}ms`);
      
      if (response.data && response.data.status === 'error') {
        throw new Error(`שגיאה ביצירת מסמך invrec ב-iCount: ${response.data.error}`);
      }
      
      const documentNumber = response.data.docnum;
      console.log(`✅ חשבונית מס קבלה משולבת נוצרה בהצלחה: ${documentNumber}`);
      console.log(`🎉 מסמך invrec ${documentNumber} כולל חשבונית + קבלה במסמך אחד`);
      console.log(`💰 הסכום מאוזן אוטומטית - אין צורך בקישור טכני נפרד`);
      
      return {
        success: true,
        data: response.data,
        invoiceNumber: documentNumber,
        receiptNumber: documentNumber, // אותו מספר כי זה מסמך משולב
        doctype: 'invrec',
        paymentMethod: paymentMethod,
        message: `חשבונית מס קבלה משולבת (${documentNumber}) נוצרה בהצלחה`
      };
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת חשבונית מס קבלה משולבת ב-iCount:', error.message);
      
      // טיפול מפורט בסוגי שגיאות שונים
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ השגיאה: timeout - החיבור ל-iCount API לקח יותר מ-30 שניות');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 השגיאה: חיבור נדחה - iCount API לא זמין');
      } else if (error.code === 'ENOTFOUND') {
        console.error('🌐 השגיאה: DNS לא נמצא - בעיה בפתרון כתובת iCount API');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ השגיאה: timeout ברשת - החיבור ל-iCount API נכשל');
      }
      
      throw error;
    }
  }
}

module.exports = new ICountService(); 