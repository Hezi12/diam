/**
 * שירות לאינטגרציה עם מערכת iCount
 * שירות זה מטפל בתקשורת עם ה-API של iCount ליצירת חשבוניות וניהולן
 * 
 * סטטוס: פעיל ומחובר ✅
 * תכונות: סליקת אשראי אמיתית, זיהוי אוטומטי של סוג כרטיס, תמיכה בשני מתחמים, יצירת חשבוניות אוטומטית
 * 
 * ⚡ תיקון חשוב (יולי 2025): הוספת קישור טכני בין חשבוניות לקבלות
 * - פונקציית createInvoiceWithReceipt עכשיו משתמשת בפרמטר related_doc_num
 * - הקבלה מקושרת טכנית לחשבונית ומאפסת את היתרה אוטומטית
 * - פותר בעיה שבה חשבוניות נשארו פתוחות במערכת iCount
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
    
    // הגדרות חשבונות לפי מיקום
    this.accounts = {
      airport: {
        companyId: 'Airport',
        username: 'diamshotels',
        password: 'Hezi!3225',
        vatId: '516679909'
      },
      rothschild: {
        companyId: 'diamshotels',
        username: 'diamshotels',
        password: 'Hezi!3225',
        vatId: '516679909'
      }
    };
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
      
      // הכנת נתוני הבקשה לפי דרישות ה-API של iCount
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // סוג מסמך וסטטוס
        doctype: 'invoice',
        
        // פרטי לקוח
        client_name: invoiceData.customer.name,
        client_id: "0",
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
   * סליקת כרטיס אשראי ויצירת חשבונית בפעולה אחת
   * 
   * @param {Object} booking - פרטי ההזמנה
   * @param {number} amount - סכום הסליקה
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאת הסליקה והחשבונית
   */
  async chargeCardAndCreateInvoice(booking, amount, location = 'rothschild') {
    try {
      console.log(`🔄 מתחיל תהליך סליקת אשראי + יצירת חשבונית עבור מתחם ${location}`);
      
      // שלב 1: ביצוע סליקת כרטיס אשראי
      console.log(`💳 שלב 1: מבצע סליקת כרטיס אשראי בסכום ${amount} ₪`);
      const chargeResult = await this.chargeCardOnly(booking, amount, location);
      
      if (!chargeResult.success) {
        throw new Error('סליקת כרטיס האשראי נכשלה');
      }
      
      console.log(`✅ סליקה הושלמה בהצלחה: ${chargeResult.transactionId}`);
      
      // שלב 2: יצירת חשבונית על סכום הסליקה בפועל
      console.log(`📄 שלב 2: יוצר חשבונית על סכום ${amount} ₪`);
      
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
      
      const invoiceResult = await this.createInvoice(invoiceData, location, 'invoice');
      
      if (!invoiceResult.success) {
        console.log(`⚠️  אזהרה: סליקה הצליחה אבל יצירת החשבונית נכשלה`);
        // לא נזרוק שגיאה כי הסליקה עצמה הצליחה
      } else {
        console.log(`✅ חשבונית נוצרה בהצלחה: ${invoiceResult.invoiceNumber}`);
      }
      
      return {
        success: true,
        charge: chargeResult,
        invoice: invoiceResult,
        message: invoiceResult.success 
          ? 'סליקה וחשבונית בוצעו בהצלחה'
          : 'סליקה בוצעה בהצלחה, אך יצירת החשבונית נכשלה'
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
        
        // פרטי לקוח
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
  async createInvoiceWithReceipt(invoiceData, location = 'rothschild', paymentMethod = 'cash') {
    try {
      console.log(`📄 יוצר חשבונית עם קבלה במיקום ${location} עם אמצעי תשלום: ${paymentMethod}`);
      
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
      
      // שלב 1: יצירת חשבונית מס
      console.log(`📄 שלב 1: יוצר חשבונית מס`);
      
      const invoiceRequestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // סוג מסמך - חשבונית מס
        doctype: 'invoice',
        
        // פרטי לקוח
        client_name: invoiceData.customer.name,
        client_id: "0",
        email: invoiceData.customer.email || '',
        client_address: invoiceData.customer.address || '',
        client_phone: invoiceData.customer.phone || '',
        
        // הגדרות
        lang: 'he',
        currency_code: 'ILS',
        
        // פרטי תשלום
        doc_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        
        // פריטים
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

      // יצירת החשבונית
      console.log(`🌐 מתחבר ל-iCount API ליצירת חשבונית מס: ${this.baseUrl}/doc/create`);
      
      const startTime = Date.now();
      const invoiceResponse = await this.axiosInstance.post(
        `${this.baseUrl}/doc/create`,
        invoiceRequestData
      );
      
      if (invoiceResponse.data && invoiceResponse.data.status === 'error') {
        throw new Error(`שגיאה ביצירת חשבונית ב-iCount: ${invoiceResponse.data.error}`);
      }
      
      const invoiceNumber = invoiceResponse.data.docnum;
      console.log(`✅ חשבונית מס נוצרה בהצלחה: ${invoiceNumber}`);
      
      // שלב 2: יצירת קבלה מקושרת טכנית לחשבונית
      console.log(`📄 שלב 2: יוצר קבלה מקושרת לחשבונית ${invoiceNumber} על אמצעי תשלום: ${paymentMethod}`);
      console.log(`🔗 קישור טכני: הקבלה תתקשר לחשבונית ${invoiceNumber} ותאפס את היתרה`);
      
      // הסכום לתשלום צריך להיות הסכום שבאמת נגבה (כולל מע"מ עבור תושבים)
      const paymentAmount = invoiceData.paymentAmount || invoiceData.total;
      
      const receiptRequestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: "0",
        
        // סוג מסמך - קבלה
        doctype: 'receipt',
        
        // פרטי לקוח (פשוטים יותר לקבלה)
        client_name: invoiceData.customer.name,
        client_id: "0",
        
        // הגדרות
        lang: 'he',
        currency_code: 'ILS',
        
        // פרטי תשלום
        doc_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        
        // קישור טכני לחשבונית - זה מה שיאפס את היתרה!
        related_doc_num: invoiceNumber,
        
        // פריט פשוט לקבלה
        items: [{
          description: `תשלום עבור חשבונית מס ${invoiceNumber}`,
          quantity: 1,
          unitprice: paymentAmount,
          tax_exempt: true // קבלה לא צריכה מע"מ נוסף
        }],
        
        // הערות עם ציון מספר החשבונית
        notes: `קבלה על חשבונית מס מספר: ${invoiceNumber}`,
      };

      // הוספת פרטי תשלום לפי האמצעי שנבחר
      switch (paymentMethod) {
        case 'cash':
          receiptRequestData.cash = { sum: paymentAmount };
          console.log(`💰 תשלום במזומן: ${paymentAmount} ₪`);
          break;
          
        case 'credit_card':
          receiptRequestData.cc = { 
            sum: paymentAmount,
            card_type: 'VISA' // ברירת מחדל
          };
          console.log(`💳 תשלום בכרטיס אשראי: ${paymentAmount} ₪`);
          break;
          
        case 'bit':
          // ביט נחשב כהעברה בנקאית עם הערה
          receiptRequestData.banktransfer = {
            sum: paymentAmount,
            reference: 'תשלום דרך ביט'
          };
          console.log(`📱 תשלום דרך ביט: ${paymentAmount} ₪`);
          break;
          
        case 'bank_transfer':
          receiptRequestData.banktransfer = {
            sum: paymentAmount,
            reference: invoiceData.transferReference || 'העברה בנקאית'
          };
          console.log(`🏦 תשלום בהעברה בנקאית: ${paymentAmount} ₪`);
          break;
          
        default:
          // ברירת מחדל - מזומן
          receiptRequestData.cash = { sum: paymentAmount };
          console.log(`💰 תשלום במזומן (ברירת מחדל): ${paymentAmount} ₪`);
      }
      
      // יצירת הקבלה
      console.log(`🌐 מתחבר ל-iCount API ליצירת קבלה: ${this.baseUrl}/doc/create`);
      
      const receiptResponse = await this.axiosInstance.post(
        `${this.baseUrl}/doc/create`,
        receiptRequestData
      );
      const endTime = Date.now();
      
      console.log(`⚡ זמן תגובה כולל מ-iCount: ${endTime - startTime}ms`);
      
      if (receiptResponse.data && receiptResponse.data.status === 'error') {
        console.log(`⚠️ אזהרה: חשבונית נוצרה (${invoiceNumber}) אבל יצירת הקבלה נכשלה: ${receiptResponse.data.error}`);
        // לא נזרוק שגיאה כי החשבונית כבר נוצרה
        return {
          success: true,
          data: invoiceResponse.data,
          invoiceNumber: invoiceNumber,
          receiptNumber: null,
          paymentMethod: paymentMethod,
          message: `חשבונית נוצרה בהצלחה (${invoiceNumber}), אך יצירת הקבלה נכשלה`
        };
      }
      
      const receiptNumber = receiptResponse.data.docnum;
      console.log(`✅ קבלה נוצרה בהצלחה: ${receiptNumber}`);
      console.log(`🎉 חשבונית עם קבלה הושלמה בהצלחה: חשבונית ${invoiceNumber}, קבלה ${receiptNumber}`);
      console.log(`💰 החשבונית ${invoiceNumber} אופסה אוטומטית ע"י הקבלה ${receiptNumber}`);
      
      return {
        success: true,
        data: {
          invoice: invoiceResponse.data,
          receipt: receiptResponse.data
        },
        invoiceNumber: invoiceNumber,
        receiptNumber: receiptNumber,
        paymentMethod: paymentMethod,
        message: `חשבונית (${invoiceNumber}) וקבלה (${receiptNumber}) נוצרו בהצלחה`
      };
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת חשבונית עם קבלה ב-iCount:', error.message);
      
      // טיפול מפורט בסוגי שגיאות שונים
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ השגיאה: timeout - החיבור ל-iCount API לקח יותר מ-30 שניות');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 השגיאה: חיבור נדחה - iCount API לא זמין');
      }
      
      throw error;
    }
  }
}

module.exports = new ICountService(); 