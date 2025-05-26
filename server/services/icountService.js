/**
 * שירות לאינטגרציה עם מערכת iCount
 * שירות זה מטפל בתקשורת עם ה-API של iCount ליצירת חשבוניות וניהולן
 */

const axios = require('axios');

class ICountService {
  constructor() {
    this.baseUrl = 'https://api.icount.co.il/api/v3.php';
    
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
   * יצירת חשבונית/חשבונית-קבלה במערכת iCount
   * 
   * @param {Object} invoiceData - נתוני החשבונית
   * @param {string} location - מיקום (airport/rothschild)
   * @param {string} documentType - סוג המסמך (invoice/invoice_receipt)
   * @returns {Promise<Object>} - תוצאת הבקשה מ-iCount
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
      
      // המרת סוג המסמך לפורמט שמקבל iCount
      const icountDoctype = documentType === 'invoice_receipt' ? 'receipt' : 'invoice';
      
      // הכנת נתוני הבקשה לפי דרישות ה-API של iCount
      const requestData = {
        // פרטי חשבון
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: accountDetails.vatId,
        
        // סוג מסמך וסטטוס
        doctype: icountDoctype,
        
        // פרטי לקוח
        client_name: invoiceData.customer.name,
        client_id: "פרטי",
        email: invoiceData.customer.email || '',
        client_address: invoiceData.customer.address || '',
        client_phone: invoiceData.customer.phone || '',
        
        // הגדרות
        lang: 'he',
        currency_code: 'ILS',
        
        // פרטי תשלום
        doc_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        
        // פריטים
        items: invoiceData.items.map(item => ({
          description: item.description || 'שירות אירוח',
          quantity: item.quantity || 1,
          unitprice: item.unitPrice || 0,
          tax_exempt: item.taxExempt || false
        })),
        
        // הערות
        notes: invoiceData.notes || '',
      };
      
      // הוספת פרטי תשלום אם יש
      if (invoiceData.paymentMethod === 'cash') {
        requestData.cash = { sum: invoiceData.total };
      } else if (invoiceData.paymentMethod === 'credit_card') {
        requestData.cc = { 
          sum: invoiceData.total,
          card_type: 'VISA',
      
        };
      } else if (invoiceData.paymentMethod === 'bank_transfer') {
        requestData.banktransfer = {
          sum: invoiceData.total,
          reference: invoiceData.transferReference || ''
        };
      }
      
      // שליחת הבקשה ל-API של iCount
      console.log(`שולח בקשה ליצירת ${icountDoctype} במיקום ${normalizedLocation}`);
      
      const response = await axios.post(
        `${this.baseUrl}/doc/create`,
        requestData
      );
      
      if (response.data && response.data.status === 'error') {
        throw new Error(`שגיאה ביצירת מסמך ב-iCount: ${response.data.error}`);
      }
      
      return {
        success: true,
        data: response.data,
        invoiceNumber: response.data.docnum
      };
      
    } catch (error) {
      console.error('שגיאה ביצירת מסמך ב-iCount:', error.message);
      
      // אם יש תשובה משרת iCount עם פרטי שגיאה
      if (error.response && error.response.data) {
        console.error('פרטי השגיאה מ-iCount:', error.response.data);
      }
      
      throw error;
    }
  }
  
  /**
   * בדיקת חיבור ל-iCount
   * 
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - פרטי החיבור
   */
  async checkConnection(location = 'rothschild') {
    try {
      // המרת המיקום לפורמט הנכון
      const normalizedLocation = location === 'airport' ? 'airport' : 'rothschild';
      
      // קבלת פרטי החשבון
      const accountDetails = this.accounts[normalizedLocation];
      
      // יצירת בקשת התחברות/בדיקה
      const requestData = {
        cid: accountDetails.companyId,
        user: accountDetails.username,
        pass: accountDetails.password,
        vat_id: accountDetails.vatId,
        module: 'user',
        method: 'login'
      };
      
      // שליחת בקשה לבדיקת החיבור
      const response = await axios.get(this.baseUrl, { params: requestData });
      
      if (response.data && response.data.sid) {
        return {
          success: true,
          sessionId: response.data.sid,
          message: 'התחברות מוצלחת ל-iCount'
        };
      }
      
      return {
        success: false,
        message: 'לא ניתן להתחבר ל-iCount - אין מזהה סשן בתשובה',
        response: response.data
      };
      
    } catch (error) {
      console.error('שגיאה בבדיקת חיבור ל-iCount:', error.message);
      return {
        success: false,
        message: `שגיאה בבדיקת חיבור ל-iCount: ${error.message}`,
        error: error
      };
    }
  }
}

module.exports = new ICountService(); 